export class ApiService {
    async getHealth() {
        return { message: "API is healthy" };
    }
}
