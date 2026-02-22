'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Label } from '@/components/ui/label';
import { Plus, MoreHorizontal, Loader2, ShieldAlert, CheckCircle2, UserX } from 'lucide-react';
import { toast } from 'sonner';
import { SearchInput } from '@/components/ui/search-input';
import { PaginationControls } from '@/components/ui/pagination-controls';

interface UserData {
  id: string;
  email: string;
  fullName: string;
  role: string;
  status: string;
  createdAt: Date;
}

interface UserManagerProps {
  initialUsers: UserData[];
  totalItems: number;
  pageSize: number;
  currentUserId: string;
}

export function UserManager({ initialUsers, totalItems, pageSize, currentUserId }: UserManagerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newUser, setNewUser] = useState({
    fullName: '',
    email: '',
    role: 'ENTITY_USER',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/entity-users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser),
      });

      if (!res.ok) {
        const errorData = await res.json();
        toast.error(errorData.message || 'Failed to add user');
        return;
      }

      setIsAddOpen(false);
      setNewUser({ fullName: '', email: '', role: 'ENTITY_USER' });
      toast.success('User added and credentials emailed successfully');
      
      startTransition(() => {
        router.refresh();
      });
    } catch (error) {
      console.error('Error adding user:', error);
      toast.error('An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateStatus = async (userId: string, targetStatus: string) => {
    try {
      const res = await fetch(`/api/entity-users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: targetStatus }),
      });

      if (!res.ok) throw new Error('Failed to update status');

      toast.success(`Account ${targetStatus.toLowerCase()} successfully`);
      startTransition(() => {
        router.refresh();
      });
    } catch (error) {
      toast.error('Failed to update user status');
    }
  };

  const handleDelete = async (userId: string) => {
    if (!confirm('Are you sure you want to permanently delete this user? This cannot be undone.')) return;

    try {
      const res = await fetch(`/api/entity-users/${userId}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Failed to delete user');

      toast.success('User deleted successfully');
      startTransition(() => {
        router.refresh();
      });
    } catch (error) {
      toast.error('Failed to delete user');
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto flex flex-col gap-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Entity Users</h1>
          <p className="text-slate-600 mt-2">Manage access and sub-accounts for your workspace</p>
        </div>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
              <Plus className="w-4 h-4" />
              Invite User
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Invite New User</DialogTitle>
              <DialogDescription>
                They will receive an email with login credentials and be forced to set a new password.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddUser} className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  value={newUser.fullName}
                  onChange={(e) => setNewUser({ ...newUser, fullName: e.target.value })}
                  required
                  placeholder="John Doe"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  required
                  placeholder="john@example.com"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="role">Role</Label>
                <select
                  id="role"
                  className="flex h-10 w-full items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2 text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                >
                  <option value="ENTITY_USER">Regular User (Billing Only)</option>
                  <option value="ENTITY_ADMIN">Administrator (Full Access)</option>
                </select>
              </div>
              <DialogFooter className="mt-4">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Inviting...
                    </>
                  ) : (
                    'Send Invitation'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="bg-white border-slate-200">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle>Team Members</CardTitle>
              <CardDescription>{totalItems} users total</CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <SearchInput placeholder="Search users by name or email..." />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Full Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead className="w-[80px]">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {initialUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-12 text-slate-500">
                        No team members found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    initialUsers.map((user) => {
                      const isMe = user.id === currentUserId;
                      return (
                        <TableRow key={user.id} className={isPending ? 'opacity-50' : ''}>
                          <TableCell className="font-medium font-sans">
                            {user.fullName}
                            {isMe && <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">You</span>}
                          </TableCell>
                          <TableCell className="text-slate-600">{user.email}</TableCell>
                          <TableCell>
                            <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold tracking-wide ${
                              user.role === 'ENTITY_ADMIN' 
                                ? 'bg-purple-100 text-purple-800' 
                                : 'bg-slate-100 text-slate-700'
                            }`}>
                              {user.role === 'ENTITY_ADMIN' ? 'Admin' : 'Regular'}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold tracking-wide ${
                              user.status === 'ACTIVE' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {user.status}
                            </span>
                          </TableCell>
                          <TableCell className="text-slate-500 text-sm">
                            {new Date(user.createdAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            {!isMe && (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                    <MoreHorizontal className="w-4 h-4 text-slate-600" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-[160px]">
                                  {user.status === 'ACTIVE' ? (
                                    <DropdownMenuItem className="text-amber-700 hover:text-amber-800" onClick={() => handleUpdateStatus(user.id, 'SUSPENDED')}>
                                      <ShieldAlert className="w-4 h-4 mr-2" />
                                      Suspend Account
                                    </DropdownMenuItem>
                                  ) : (
                                    <DropdownMenuItem className="text-green-700 hover:text-green-800" onClick={() => handleUpdateStatus(user.id, 'ACTIVE')}>
                                      <CheckCircle2 className="w-4 h-4 mr-2" />
                                      Reactivate Account
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem className="text-red-600 focus:bg-red-50" onClick={() => handleDelete(user.id)}>
                                    <UserX className="w-4 h-4 mr-2" />
                                    Delete User
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
            
            <PaginationControls totalItems={totalItems} pageSize={pageSize} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
