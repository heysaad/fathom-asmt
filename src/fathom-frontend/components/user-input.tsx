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
                <div className="flex-1 text-left flex gap-2 items-center">
                    <div className="flex-1 max-w-32 truncate">{user.name ?? user.email}</div>
                    {user.designation && <div className="text-xs text-muted-foreground">• {user.designation}</div>}
                </div>
            </div>
        </SelectItem>
    )
}

export function UserInput({
    value,
    onValueChange,
    placeholder,
    includeAll = false,
    allLabel = "All users",
}: {
    value?: string,
    onValueChange?: (value?: string) => void,
    placeholder?: string,
    includeAll?: boolean,
    allLabel?: string,
}) {
    const [users, setUsers] = useState<UserVM[]>([])
    const allValue = "__all_users__";

    useEffect(() => {
        let cancelled = false;

        apiClient.get<UserVM[]>('/users').then((response) => {
            ensureSuccess(response)
            if (!cancelled) {
                setUsers(response.data)
            }
        })

        return () => {
            cancelled = true;
        }
    }, [])

    return (
        <Select
            value={includeAll ? value || allValue : value}
            onValueChange={(nextValue) =>
                onValueChange?.(nextValue === allValue ? undefined : nextValue)
            }
        >
            <SelectTrigger className="w-[180px]">
                <SelectValue placeholder={placeholder ?? 'Select user'} />
            </SelectTrigger>
            <SelectContent>
                <SelectGroup>
                    {includeAll && <SelectItem value={allValue}>{allLabel}</SelectItem>}
                    {users.map((user) => (
                        <UserInputItem key={user.id} {...user} />
                    ))}
                </SelectGroup>
            </SelectContent>
        </Select>
    );
}
