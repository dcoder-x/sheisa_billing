'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Check, X, Loader2, Eye } from 'lucide-react';
import { toast } from 'sonner';

interface RegistrationRequest {
  id: string;
  entityName: string;
  registrationNumber: string;
  email: string;
  phone: string;
  businessType: string;
  country: string;
  // Additional fields
  address: string;
  city: string;
  state: string;
  postalCode: string;
  subdomain: string;
  logoUrl?: string;
  themeColor?: string;
  
  createdAt: string;
  status: 'PENDING' | 'APPROVED' | 'DECLINED';
}

export default function AdminRequestsPage() {
  const router = useRouter();
  const [requests, setRequests] = useState<RegistrationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [declineReason, setDeclineReason] = useState('');
  const [selectedRequest, setSelectedRequest] = useState<RegistrationRequest | null>(null);
  const [isDeclineOpen, setIsDeclineOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const fetchRequests = async () => {
    try {
      const res = await fetch('/api/admin/requests?status=PENDING');
      if (res.ok) {
        const data = await res.json();
        setRequests(data);
      }
    } catch (error) {
      console.error('Failed to fetch requests', error);
      toast.error('Failed to load validation requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleAction = async (id: string, status: 'APPROVED' | 'DECLINED', reason?: string) => {
    setActionLoading(id);
    try {
      const res = await fetch(`/api/admin/requests/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status, declineReason: reason }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.message || 'Action failed');
        return;
      }

      toast.success(status === 'APPROVED' ? 'Request approved' : 'Request declined');
      setRequests((prev) => prev.filter((req) => req.id !== id));
      setIsDeclineOpen(false);
      setIsDetailsOpen(false);
      setDeclineReason('');
      setSelectedRequest(null);
    } catch (error) {
      console.error('Action error:', error);
      toast.error('An error occurred');
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-slate-900">Registration Requests</h1>
        <Badge variant="outline" className="px-4 py-1">
          {requests.length} Pending
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pending Approvals</CardTitle>
        </CardHeader>
        <CardContent>
          {requests.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              No pending registration requests
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Entity Name</TableHead>
                  <TableHead>Reg. Number</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell className="font-medium">{request.entityName}</TableCell>
                    <TableCell>{request.registrationNumber}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-sm">{request.email}</span>
                        <span className="text-xs text-slate-500">{request.phone}</span>
                      </div>
                    </TableCell>
                    <TableCell>{request.businessType}</TableCell>
                    <TableCell>{request.country}</TableCell>
                    <TableCell>
                      {new Date(request.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                         <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setSelectedRequest(request);
                            setIsDetailsOpen(true);
                          }}
                        >
                          <Eye className="w-4 h-4" />
                          <span className="sr-only">View Details</span>
                        </Button>

                        <Button
                          size="sm"
                          variant="outline"
                          className="text-green-600 hover:text-green-700 hover:bg-green-50"
                          onClick={() => handleAction(request.id, 'APPROVED')}
                          disabled={actionLoading === request.id}
                        >
                          {actionLoading === request.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Check className="w-4 h-4" />
                          )}
                          <span className="ml-2 sr-only">Approve</span>
                        </Button>

                         <Button
                            size="sm"
                            variant="outline"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => {
                                setSelectedRequest(request);
                                setIsDeclineOpen(true);
                            }}
                          >
                            <X className="w-4 h-4" />
                            <span className="sr-only">Decline</span>
                          </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Request Details</DialogTitle>
             <DialogDescription>
                Full registration information for {selectedRequest?.entityName}
             </DialogDescription>
          </DialogHeader>
          
          {selectedRequest && (
              <div className="grid grid-cols-2 gap-6 py-4">
                  <div className="space-y-4">
                      <h3 className="font-semibold text-lg border-b pb-2">Business Info</h3>
                      <div className="grid grid-cols-[100px_1fr] gap-2">
                          <span className="text-muted-foreground">Entity Name:</span>
                          <span className="font-medium">{selectedRequest.entityName}</span>
                          
                          <span className="text-muted-foreground">Reg Number:</span>
                          <span>{selectedRequest.registrationNumber}</span>
                          
                          <span className="text-muted-foreground">Type:</span>
                          <span>{selectedRequest.businessType}</span>

                           <span className="text-muted-foreground">Date:</span>
                          <span>{new Date(selectedRequest.createdAt).toLocaleString()}</span>
                      </div>
                  </div>

                  <div className="space-y-4">
                      <h3 className="font-semibold text-lg border-b pb-2">Contact & Location</h3>
                      <div className="grid grid-cols-[100px_1fr] gap-2">
                          <span className="text-muted-foreground">Email:</span>
                          <span>{selectedRequest.email}</span>
                          
                          <span className="text-muted-foreground">Phone:</span>
                          <span>{selectedRequest.phone}</span>
                          
                          <span className="text-muted-foreground">Address:</span>
                          <span>
                            {selectedRequest.address}<br/>
                            {selectedRequest.city}, {selectedRequest.state} {selectedRequest.postalCode}<br/>
                            {selectedRequest.country}
                          </span>
                      </div>
                  </div>

                  <div className="space-y-4 col-span-2">
                      <h3 className="font-semibold text-lg border-b pb-2">Branding & System</h3>
                      <div className="grid grid-cols-2 gap-4">
                           <div className="grid grid-cols-[100px_1fr] gap-2">
                              <span className="text-muted-foreground">Subdomain:</span>
                              <span className="font-bold text-primary">{selectedRequest.subdomain}</span>

                              <span className="text-muted-foreground">Theme:</span>
                              <div className="flex items-center gap-2">
                                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: selectedRequest.themeColor }} />
                                  <span>{selectedRequest.themeColor}</span>
                              </div>
                           </div>
                           
                           {selectedRequest.logoUrl && (
                               <div>
                                   <span className="block text-muted-foreground mb-2">Logo:</span>
                                   <div className="border rounded p-2 inline-block bg-slate-50">
                                       {/* eslint-disable-next-line @next/next/no-img-element */}
                                       <img src={selectedRequest.logoUrl} alt="Logo" className="h-16 object-contain" />
                                   </div>
                               </div>
                           )}
                      </div>
                  </div>
              </div>
          )}

          <DialogFooter className="gap-2 sm:justify-between">
             <Button variant="ghost" onClick={() => setIsDetailsOpen(false)}>Close</Button>
             <div className="flex gap-2">
                <Button
                    variant="outline"
                    className="text-red-600 hover:bg-red-50 hover:text-red-700"
                    onClick={() => {
                        setIsDetailsOpen(false);
                        setIsDeclineOpen(true);
                    }}
                >
                    Decline
                </Button>
                <Button
                    className="bg-green-600 hover:bg-green-700 text-white"
                    onClick={() => selectedRequest && handleAction(selectedRequest.id, 'APPROVED')}
                    disabled={!selectedRequest || actionLoading === selectedRequest.id}
                >
                     {actionLoading === selectedRequest?.id && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                    Approve Request
                </Button>
             </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Decline Dialog */}
      <Dialog open={isDeclineOpen} onOpenChange={(open) => {
        setIsDeclineOpen(open);
        if (!open && !isDetailsOpen) {
             setDeclineReason('');
             // Don't clear selectedRequest if we might go back to details? 
             // Actually, usually we close everything.
             setSelectedRequest(null);
        }
      }}>
        <DialogContent>
        <DialogHeader>
            <DialogTitle>Decline Registration</DialogTitle>
            <DialogDescription>
            Please provide a reason for declining this registration request.
            The applicant will receive an email notification.
            </DialogDescription>
        </DialogHeader>
        <div className="py-4">
            <Textarea
            placeholder="Reason for rejection..."
            value={declineReason}
            onChange={(e) => setDeclineReason(e.target.value)}
            />
        </div>
        <DialogFooter>
            <Button
            variant="outline"
            onClick={() => setIsDeclineOpen(false)}
            >
            Cancel
            </Button>
            <Button
            variant="destructive"
            onClick={() => selectedRequest && handleAction(selectedRequest.id, 'DECLINED', declineReason)}
            disabled={!declineReason.trim() || !selectedRequest || actionLoading === selectedRequest.id}
            >
            {actionLoading === selectedRequest?.id ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : null}
            Decline Request
            </Button>
        </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
