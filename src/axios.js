import axios from "axios";


export const request = axios.create({
    baseURL: "https://uni-trade-api-production.up.railway.app",
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
