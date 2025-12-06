'use client';

import { useState, useEffect } from 'react';
import { ChevronsUpDown, Check, Plus, Users, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { CreateTeamModal } from './CreateTeamModal';
import { useRouter } from 'next/navigation';

type Team = {
    id: string;
    name: string;
    slug: string;
};

export function TeamSwitcher() {
    const [selectedTeam, setSelectedTeam] = useState<Team | null>(null); // Null = Personal
    const [teams, setTeams] = useState<Team[]>([]);
    const [openModal, setOpenModal] = useState(false);
    const router = useRouter();

    useEffect(() => {
        fetchTeams();
    }, []);

    const fetchTeams = async () => {
        try {
            const res = await fetch('/api/teams');
            if (res.ok) {
                const data = await res.json();
                setTeams(data.teams || []);
            }
        } catch (e) {
            console.error('Failed to fetch teams', e);
        }
    };

    const handleTeamSelect = (team: Team | null) => {
        setSelectedTeam(team);
        // Persist selection via URL param or context? 
        // For MVP, maybe we pass ?teamId=... to dashboard route
        // Updating URL:
        const url = new URL(window.location.href);
        if (team) {
            url.searchParams.set('teamId', team.id);
        } else {
            url.searchParams.delete('teamId');
        }
        router.push(url.toString()); // Soft navigate
        router.refresh(); // Refresh data
    };

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button
                        variant="ghost"
                        role="combobox"
                        className="w-full justify-between px-2 text-primary hover:bg-muted"
                    >
                        <div className="flex items-center gap-2 truncate">
                            {selectedTeam ? (
                                <>
                                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-primary/20 text-primary">
                                        <Users className="h-3 w-3" />
                                    </div>
                                    <span className="truncate">{selectedTeam.name}</span>
                                </>
                            ) : (
                                <>
                                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-muted text-muted-foreground">
                                        <User className="h-3 w-3" />
                                    </div>
                                    <span className="truncate">Personal</span>
                                </>
                            )}
                        </div>
                        <ChevronsUpDown className="ml-auto h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-[200px] p-0" align="start">
                    <DropdownMenuLabel className="text-xs text-muted-foreground px-2 py-1.5">
                        Personal Account
                    </DropdownMenuLabel>
                    <DropdownMenuItem
                        onSelect={() => handleTeamSelect(null)}
                        className="gap-2 p-2"
                    >
                        <div className="flex h-6 w-6 items-center justify-center rounded border bg-background">
                            <User className="h-3 w-3" />
                        </div>
                        Personal
                        {!selectedTeam && <Check className="ml-auto h-4 w-4" />}
                    </DropdownMenuItem>

                    {teams.length > 0 && (
                        <>
                            <DropdownMenuSeparator />
                            <DropdownMenuLabel className="text-xs text-muted-foreground px-2 py-1.5">
                                Teams
                            </DropdownMenuLabel>
                            {teams.map((team) => (
                                <DropdownMenuItem
                                    key={team.id}
                                    onSelect={() => handleTeamSelect(team)}
                                    className="gap-2 p-2"
                                >
                                    <div className="flex h-6 w-6 items-center justify-center rounded border bg-background">
                                        <Users className="h-3 w-3" />
                                    </div>
                                    {team.name}
                                    {selectedTeam?.id === team.id && <Check className="ml-auto h-4 w-4" />}
                                </DropdownMenuItem>
                            ))}
                        </>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="gap-2 p-2" onSelect={() => setOpenModal(true)}>
                        <div className="flex h-6 w-6 items-center justify-center rounded border border-dashed bg-background">
                            <Plus className="h-3 w-3" />
                        </div>
                        Create Team
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            <CreateTeamModal
                open={openModal}
                onOpenChange={setOpenModal}
                onCreated={(team) => {
                    setTeams([...teams, team]);
                    handleTeamSelect(team);
                }}
            />
        </>
    );
}
