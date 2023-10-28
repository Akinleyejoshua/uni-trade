import axios from "axios";


export const request = axios.create({
    baseURL: "http://localhost:8000",
    headers: {
        Accept: 'application/json,text/plain,*/*',
        'Content-Type': 'application/json',
        "Access-Control-Allow-Origin": "*",
    }
})

request.interceptors.request.use(
	(config) => {
		const token = "12345678"
		if (token) {
			config.headers.Authorization = `Bearer ${token}`;
		}
		return config;
	},
	(error) => {
		return Promise.reject(error);
	}
);