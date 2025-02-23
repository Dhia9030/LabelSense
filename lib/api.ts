import axios from "axios";

const API_URL = "http://localhost:8000"; // Change l'URL si tu déploies le backend ailleurs

export const uploadImage = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);

    try {
        const response = await axios.post(`${API_URL}/predict/`, formData, {
            headers: { "Content-Type": "multipart/form-data" },
        });
        return response.data;
    } catch (error) {
        console.error("Erreur lors de l'upload:", error);
        throw error;
    }
};
