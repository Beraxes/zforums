import { Injectable, NotFoundException, InternalServerErrorException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Post } from 'src/common/schemas/post.entity';
import { Repository } from 'typeorm';
import { CreatePostDto, UpdatePostDto } from './post.dto';
import { User } from 'src/common/schemas/user.entity';
import { PostShare } from 'src/common/schemas/postShare.entity';
import { Like } from 'src/common/schemas/like.entity';

@Injectable()
export class PostService {
  constructor(
    @InjectRepository(Post)
    private readonly postRepository: Repository<Post>,

    @InjectRepository(PostShare)
    private readonly postShareRepository: Repository<PostShare>,

    @InjectRepository(Like)
    private readonly likeRepository: Repository<Like>,
  ) {}

  async create(createPostDto: CreatePostDto, user: User): Promise<Post> {
    const post = this.postRepository.create({ ...createPostDto, author: user });
    try {
      return await this.postRepository.save(post);
    } catch (error) {
      console.error('Error saving post:', error);
      throw new InternalServerErrorException('Failed to create post');
    }
  }

  async findAll(): Promise<Post[]> {
    return this.postRepository.find({
      relations: ['author', 'comments', 'comments.author'],
    });
  }

  async findOne(id: number): Promise<Post> {
    const post = await this.postRepository.findOne({
      where: { id },
      relations: ['author', 'comments', 'comments.author'],
    });
    if (!post) {
      throw new NotFoundException(`Post with ID ${id} not found`);
    }
    return post;
  }

  async update(id: number, updatePostDto: UpdatePostDto): Promise<Post> {
    const post = await this.findOne(id);
    this.postRepository.merge(post, updatePostDto);
    return this.postRepository.save(post);
  }

  async remove(id: number): Promise<void> {
    const post = await this.findOne(id);
    await this.postRepository.softRemove(post);
  }

  async likePost(postId: number): Promise<Post> {
    const post = await this.findOne(postId);
    if (!post) {
      throw new NotFoundException(`Post with ID ${postId} not found`);
    }


    try {
      return await this.postRepository.save(post);
    } catch (error) {
      console.error('Error liking post:', error);
      throw new InternalServerErrorException('Failed to like post');
    }
  }

  async getSharedPostsByUser(userId: number): Promise<Post[]> {
    const postShares = await this.postShareRepository.find({
      where: { userId },
      relations: ['post', 'post.author', 'post.comments', 'post.comments.author'],
      order: {
        sharedAt: 'DESC'
      },
    });
  
    return postShares.map(postShare => postShare.post).filter(post => post !== null);
  }
  
  

  async sharePost(postId: number, user: User): Promise<PostShare> {
    const post = await this.findOne(postId);
    if (!post) {
      throw new NotFoundException(`Post with ID ${postId} not found`);
    }

    const existingShare = await this.postShareRepository.findOne({
      where: { post: { id: postId }, user: { id: user.id } },
    });

    if (existingShare) {
      throw new ConflictException('User has already shared this post');
    }

    const postShare = this.postShareRepository.create({ user, post });
    try {
      return await this.postShareRepository.save(postShare);
    } catch (error) {
      console.error('Error sharing post:', error);
      throw new InternalServerErrorException('Failed to share post');
    }
  }
  // Add the like method
  async like(postId: number, userId: number) {
    const existingLike = await this.likeRepository.findOne({
      where: { post: { id: postId }, user: { id: userId } },
    });
  
    if (existingLike) {
      throw new ConflictException('User has already liked this post');
    }
  
    const like = this.likeRepository.create({ post: { id: postId }, user: { id: userId } });
    return await this.likeRepository.save(like);
  }

  async unlike(postId: number, userId: number) {
    const like = await this.likeRepository.findOne({
      where: { post: { id: postId }, user: { id: userId } },
    });

    if (like) {
      await this.likeRepository.remove(like);
    }
  }
}
