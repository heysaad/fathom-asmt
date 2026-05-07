'use client';

import apiClient from "@/app/lib/api-client"
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/datatable";
import { InputGroup, InputGroupAddon, InputGroupInput, InputGroupText } from "@/components/ui/input-group";
import { SearchIcon } from "lucide-react";
import Link from "next/link";
import React from "react";
import CreateShipDialog, { CreateShipDialogHandle } from "./components/createShipDialog";

export default () => {
    const [ships, setShips] = React.useState<{ id: string, name: string, imo: string }[]>([]);
    const addRef = React.useRef<CreateShipDialogHandle>(null);

    const loadShips = async () => {
        var data = await apiClient.get<{ id: string, name: string, imo: string }[]>("/ships");
        setShips(data.data);
    }

    const showAdd = () => addRef.current?.show();

    React.useEffect(() => {
        loadShips();
    }, []);

    return (
        <div className="container max-w-3xl mx-auto">
            <div className="mb-4 flex justify-between gap-4">
                <h2 className="page-title">Ships</h2>

                <div className="flex gap-3 items-center">
                    <InputGroup>
                        <InputGroupInput placeholder="Search.." />
                        <InputGroupAddon>
                            <SearchIcon className="size-4" />
                        </InputGroupAddon>
                    </InputGroup>
                    <Button onClick={showAdd}>Add Ship</Button>
                </div>
            </div>

            <DataTable columns={[
                {
                    accessorKey: "name",
                    header: "Name",
                    cell: ({ row }) =>
                        <Link href={`/ships/${row.original.id}`} className="flex items-center gap-2">
                            <div className="bg-gray-100 rounded-lg size-10"></div>
                            <div>
                                {row.original.name}
                                <div className="text-xs text-muted-foreground">
                                    IMO: {row.original.id}
                                </div>
                            </div>
                        </Link>
                }
            ]} data={ships} />
            <CreateShipDialog ref={addRef} />
        </div>
    )
}