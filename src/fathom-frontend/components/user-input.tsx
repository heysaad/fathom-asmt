import { ensureSuccess, getAvatarUrl } from "@/app/lib/helpers";
import { Avatar, AvatarImage } from "./ui/avatar";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { UserVM } from "@/app/(main)/admin/users/models";
import { useEffect, useState } from "react";
import apiClient from "@/app/lib/api-client";

export function UserInputItem(user: UserVM) {
    return (
        <SelectItem value={user.id}>
            <div className="flex gap-2 items-center">
                <Avatar size="sm">
                    <AvatarImage src={getAvatarUrl(user.name ?? user.email)} />
                </Avatar>
                <div className="flex-1 text-left">
                    <div>{user.name ?? user.email}</div>
                </div>
            </div>
        </SelectItem>
    )
}

export function UserInput({
    value,
    onValueChange,
    placeholder
}: {
    value?: string,
    onValueChange?: (value: string) => void,
    placeholder?: string
}) {
    const [users, setUsers] = useState<UserVM[]>([])

    const loadUsers = async () => {
        const response = await apiClient.get<UserVM[]>('/users')
        ensureSuccess(response)
        setUsers(response.data)
    }

    useEffect(() => {
        loadUsers()
    }, [])

    return (
        <Select value={value} onValueChange={onValueChange}>
            <SelectTrigger className="w-[180px]">
                <SelectValue placeholder={placeholder ?? 'Select user'} />
            </SelectTrigger>
            <SelectContent>
                <SelectGroup>
                    {users.map(UserInputItem)}
                </SelectGroup>
            </SelectContent>
        </Select>
    );
}