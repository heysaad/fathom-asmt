import { AxiosResponse } from "axios";
import { toast } from "sonner";

export const ensureSuccess = (res: AxiosResponse) => {
    if (!res) {
        toast.error("Network error: No response from server");
        throw new Error("Network error: No response from server");
    }

    if (res.status < 200 || res.status >= 300) {
        toast.error(`Error: ${res.status} ${res.statusText}`);
        throw new Error(`Request failed with status ${res.status}`);
    }
}

export const getAvatarUrl = (name: string) => {
    return `https://ui-avatars.com/api/?name=${name ?? 'user'}&background=random`
}