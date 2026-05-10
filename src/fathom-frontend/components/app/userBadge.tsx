import { UserVM } from "@/app/(main)/admin/users/models";
import { Avatar, AvatarImage } from "../ui/avatar";
import { getAvatarUrl } from "@/app/lib/helpers";

export function UserBadge({ data }: { data: UserVM }) {
    return <div className="flex gap-2 items-center">
        <Avatar title={data.name ?? ""}>
            <AvatarImage
                src={getAvatarUrl(
                    data?.name ??
                    data?.email
                )}
            />
        </Avatar>
        <div className="text-sm">
            <div className="font-medium">
                {data.name || "Unnamed"}
            </div>
            <div className="text-xs text-muted-foreground">
                {data.email}
            </div>
        </div>
    </div>
}

export function UserBadgeSm({ data }: { data: UserVM }) {
    return <div className="flex gap-2 items-center">
        <Avatar title={data.name ?? ""} size="sm">
            <AvatarImage
                src={getAvatarUrl(
                    data?.name ??
                    data?.email
                )}
            />
        </Avatar>
        <div className="text-sm">
            <div className="font-medium">
                {data.name || "Unnamed"}
            </div>
        </div>
    </div>
}
