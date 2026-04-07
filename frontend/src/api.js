import axios from 'axios';

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://grocerease-3.onrender.com';

const API = axios.create({
    baseURL: `${API_BASE_URL}/api/`,
});

export const fetchProducts = () => API.get('products/');
export const fetchCategories = () => API.get('categories/');

export default API;
