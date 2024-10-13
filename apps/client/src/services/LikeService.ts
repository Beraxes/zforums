import axios from 'axios';
import { authState } from '@/core/auth';

const API_URL = '/likes';

export const getLikes = async (postId: number): Promise<any> => {
  try {
    const response = await axios.get(`${API_URL}/${postId}`, {
      headers: {
        'Authorization': `Bearer ${authState.token}`
      }
    });
    return response.data;
  } catch (error) {
    console.error(`Error fetching likes for post ${postId}:`, error);
    throw error;
  }
};
