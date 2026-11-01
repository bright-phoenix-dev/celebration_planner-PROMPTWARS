'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Users, Pencil, X, Check, ChevronDown, ChevronUp } from 'lucide-react';
import { useVendors } from '@/hooks/useVendors';
import { VENDOR_STATUS_LABELS } from '@/schemas';
import { formatCurrency } from '@/lib/constants';
import type { Vendor, VendorStatus } from '@/types';

const STATUS_BADGE_VARIANTS: Record<
  VendorStatus,
  'default' | 'secondary' | 'outline' | 'success' | 'warning'
> = {
  'to-contact': 'outline',
  contacted: 'secondary',
  quoted: 'warning',
  booked: 'default',
  paid: 'success',
};

const STATUS_OPTIONS: VendorStatus[] = ['to-contact', 'contacted', 'quoted', 'booked', 'paid'];

interface EditFormState {
  name: string;
  status: VendorStatus;
  quotedPrice?: number;
  notes: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
}

const initialEditState: EditFormState = {
  name: '',
  status: 'to-contact',
  notes: '',
  contactName: '',
  contactEmail: '',
  contactPhone: '',
};

/**
 * Vendors tab showing vendor checklist with status tracking and edit capability.
 */
export function VendorsTab() {
  const { vendors, progress, updateVendor } = useVendors();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<EditFormState>(initialEditState);

  const startEdit = (vendor: Vendor) => {
    setEditingId(vendor.id);
    setEditForm({
      name: vendor.name ?? '',
      status: vendor.status,
      quotedPrice: vendor.quotedPrice,
      notes: vendor.notes ?? '',
      contactName: vendor.contactName ?? '',
      contactEmail: vendor.contactEmail ?? '',
      contactPhone: vendor.contactPhone ?? '',
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm(initialEditState);
  };

  const saveEdit = (vendor: Vendor) => {
    updateVendor({
      ...vendor,
      name: editForm.name.trim() || undefined,
      status: editForm.status,
      quotedPrice: editForm.quotedPrice,
      notes: editForm.notes.trim() || undefined,
      contactName: editForm.contactName.trim() || undefined,
      contactEmail: editForm.contactEmail.trim() || undefined,
      contactPhone: editForm.contactPhone.trim() || undefined,
    });
    setEditingId(null);
    setEditForm(initialEditState);
  };

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="space-y-6">
      {/* Progress header */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" aria-hidden="true" />
            Vendor Checklist
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Progress
              value={progress.progressPercent}
              className="flex-1"
              aria-label={`Vendors progress: ${String(progress.completedVendors)} of ${String(progress.totalVendors)} booked`}
            />
            <span className="text-sm font-medium">
              {progress.completedVendors}/{progress.totalVendors} booked
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Vendor list */}
      <div className="space-y-3">
        {vendors.map((vendor) => {
          const isEditing = editingId === vendor.id;
          const isExpanded = expandedId === vendor.id;

          return (
            <Card key={vendor.id}>
              <CardContent className="p-4">
                {isEditing ? (
                  /* Edit form */
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold">{vendor.category}</h3>
                      <div className="flex gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7"
                          onClick={() => {
                            saveEdit(vendor);
                          }}
                          aria-label="Save"
                        >
                          <Check className="h-3.5 w-3.5" aria-hidden="true" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7"
                          onClick={() => {
                            cancelEdit();
                          }}
                          aria-label="Cancel"
                        >
                          <X className="h-3.5 w-3.5" aria-hidden="true" />
                        </Button>
                      </div>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <Label htmlFor={`vendor-name-${vendor.id}`}>Vendor Name</Label>
                        <Input
                          id={`vendor-name-${vendor.id}`}
                          value={editForm.name}
                          onChange={(e) => {
                            setEditForm({ ...editForm, name: e.target.value });
                          }}
                          maxLength={200}
                        />
                      </div>
                      <div>
                        <Label htmlFor={`vendor-status-${vendor.id}`}>Status</Label>
                        <select
                          id={`vendor-status-${vendor.id}`}
                          value={editForm.status}
                          onChange={(e) => {
                            setEditForm({
                              ...editForm,
                              status: e.target.value as VendorStatus,
                            });
                          }}
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        >
                          {STATUS_OPTIONS.map((s) => (
                            <option key={s} value={s}>
                              {VENDOR_STATUS_LABELS[s]}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <Label htmlFor={`vendor-price-${vendor.id}`}>Quoted Price</Label>
                        <Input
                          id={`vendor-price-${vendor.id}`}
                          type="number"
                          min={0}
                          value={editForm.quotedPrice ?? ''}
                          onChange={(e) => {
                            setEditForm({
                              ...editForm,
                              quotedPrice: e.target.value ? parseFloat(e.target.value) : undefined,
                            });
                          }}
                        />
                      </div>
                      <div>
                        <Label htmlFor={`vendor-contact-${vendor.id}`}>Contact Name</Label>
                        <Input
                          id={`vendor-contact-${vendor.id}`}
                          value={editForm.contactName}
                          onChange={(e) => {
                            setEditForm({
                              ...editForm,
                              contactName: e.target.value,
                            });
                          }}
                          maxLength={200}
                        />
                      </div>
                      <div>
                        <Label htmlFor={`vendor-email-${vendor.id}`}>Email</Label>
                        <Input
                          id={`vendor-email-${vendor.id}`}
                          type="email"
                          value={editForm.contactEmail}
                          onChange={(e) => {
                            setEditForm({
                              ...editForm,
                              contactEmail: e.target.value,
                            });
                          }}
                          maxLength={254}
                        />
                      </div>
                      <div>
                        <Label htmlFor={`vendor-phone-${vendor.id}`}>Phone</Label>
                        <Input
                          id={`vendor-phone-${vendor.id}`}
                          type="tel"
                          value={editForm.contactPhone}
                          onChange={(e) => {
                            setEditForm({
                              ...editForm,
                              contactPhone: e.target.value,
                            });
                          }}
                          maxLength={20}
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor={`vendor-notes-${vendor.id}`}>Notes</Label>
                      <Textarea
                        id={`vendor-notes-${vendor.id}`}
                        value={editForm.notes}
                        onChange={(e) => {
                          setEditForm({ ...editForm, notes: e.target.value });
                        }}
                        maxLength={1000}
                        rows={2}
                      />
                    </div>
                  </div>
                ) : (
                  /* Display view */
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{vendor.category}</h3>
                        {vendor.name && (
                          <span className="text-sm text-muted-foreground">— {vendor.name}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={STATUS_BADGE_VARIANTS[vendor.status]}>
                          {VENDOR_STATUS_LABELS[vendor.status]}
                        </Badge>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7"
                          onClick={() => {
                            startEdit(vendor);
                          }}
                          aria-label={`Edit ${vendor.category}`}
                        >
                          <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7"
                          onClick={() => {
                            toggleExpand(vendor.id);
                          }}
                          aria-label={
                            isExpanded
                              ? `Collapse details for ${vendor.category}`
                              : `Expand details for ${vendor.category}`
                          }
                          aria-expanded={isExpanded}
                        >
                          {isExpanded ? (
                            <ChevronUp className="h-3.5 w-3.5" aria-hidden="true" />
                          ) : (
                            <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
                          )}
                        </Button>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                        {vendor.quotedPrice !== undefined && (
                          <p>
                            <span className="text-muted-foreground">Quoted:</span>{' '}
                            {formatCurrency(vendor.quotedPrice)}
                          </p>
                        )}
                        {vendor.contactName && (
                          <p>
                            <span className="text-muted-foreground">Contact:</span>{' '}
                            {vendor.contactName}
                          </p>
                        )}
                        {vendor.contactEmail && (
                          <p>
                            <span className="text-muted-foreground">Email:</span>{' '}
                            {vendor.contactEmail}
                          </p>
                        )}
                        {vendor.contactPhone && (
                          <p>
                            <span className="text-muted-foreground">Phone:</span>{' '}
                            {vendor.contactPhone}
                          </p>
                        )}
                        {vendor.notes && (
                          <p className="sm:col-span-2">
                            <span className="text-muted-foreground">Notes:</span> {vendor.notes}
                          </p>
                        )}
                        {!vendor.quotedPrice && !vendor.contactName && !vendor.notes && (
                          <p className="text-muted-foreground">
                            No details yet. Click edit to add information.
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
