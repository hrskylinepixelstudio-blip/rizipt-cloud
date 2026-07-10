import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Building2, Upload, Loader2 } from 'lucide-react';
import TextField from '../../components/TextField.jsx';
import Button from '../../components/Button.jsx';
import Select from '../../components/Select.jsx';
import { fetchCompanyProfile, updateCompanyProfile, uploadCompanyLogo } from '../../services/companyService.js';
import { INDIAN_STATES } from '../../lib/indianStates.js';
import { toast } from '../../store/toastStore.js';
import { useAuthStore } from '../../store/authStore.js';

export default function CompanyProfilePage() {
  const queryClient = useQueryClient();
  const fileInputRef = useRef(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const setUser = useAuthStore((s) => s.setUser);
  const user = useAuthStore((s) => s.user);

  const { data: profile, isLoading } = useQuery({
    queryKey: ['company-profile'],
    queryFn: fetchCompanyProfile,
  });

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm();

  useEffect(() => {
    if (profile) {
      reset({
        name: profile.name || '',
        legalName: profile.legal_name || '',
        gstin: profile.gstin || '',
        pan: profile.pan || '',
        addressLine1: profile.address_line1 || '',
        addressLine2: profile.address_line2 || '',
        city: profile.city || '',
        state: profile.state || '',
        stateCode: profile.state_code || '',
        pincode: profile.pincode || '',
        phone: profile.phone || '',
        email: profile.email || '',
        website: profile.website || '',
        upiId: profile.upi_id || '',
        invoicePrefix: profile.invoice_prefix || 'INV',
      });
      setLogoPreview(profile.logo_url || null);
    }
  }, [profile, reset]);

  const updateMutation = useMutation({
    mutationFn: updateCompanyProfile,
    onSuccess: () => {
      toast.success('Company profile saved');
      queryClient.invalidateQueries({ queryKey: ['company-profile'] });
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Failed to save profile'),
  });

  const logoMutation = useMutation({
    mutationFn: uploadCompanyLogo,
    onSuccess: ({ url }) => {
      setLogoPreview(url);
      toast.success('Logo uploaded');
      queryClient.invalidateQueries({ queryKey: ['company-profile'] });
      if (user) setUser({ ...user, logo_url: url });
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Failed to upload logo'),
  });

  const onSubmit = (values) => updateMutation.mutate(values);

  const onLogoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoPreview(URL.createObjectURL(file));
    logoMutation.mutate(file);
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-brand-600" />
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Company Profile</h1>
        <p className="text-sm text-slate-500">
          This appears on every Quotation, Invoice, Receipt, and Contract you generate.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-6 flex items-center gap-5">
          <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-xl border border-dashed border-slate-300 bg-slate-50 dark:border-slate-700 dark:bg-slate-800">
            {logoPreview ? (
              <img src={logoPreview} alt="Company logo" className="h-full w-full object-contain" />
            ) : (
              <Building2 className="h-8 w-8 text-slate-300" />
            )}
          </div>
          <div>
            <Button
              type="button"
              variant="secondary"
              isLoading={logoMutation.isPending}
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-4 w-4" />
              {logoPreview ? 'Change logo' : 'Upload logo'}
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/svg+xml"
              className="hidden"
              onChange={onLogoChange}
            />
            <p className="mt-2 text-xs text-slate-500">PNG, JPG, WEBP or SVG. Max 2MB.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <TextField label="Company name" error={errors.name?.message} {...register('name', { required: 'Required' })} />
          <TextField label="Legal name" {...register('legalName')} />
          <TextField label="GSTIN" placeholder="33ABCDE1234F1Z5" {...register('gstin')} />
          <TextField label="PAN" placeholder="ABCDE1234F" {...register('pan')} />
          <TextField label="Phone" {...register('phone')} />
          <TextField label="Email" type="email" {...register('email')} />
          <TextField label="Website" {...register('website')} />
          <TextField label="UPI ID" placeholder="yourname@upi" {...register('upiId')} />

          <div className="sm:col-span-2">
            <TextField label="Address line 1" {...register('addressLine1')} />
          </div>
          <div className="sm:col-span-2">
            <TextField label="Address line 2" {...register('addressLine2')} />
          </div>

          <TextField label="City" {...register('city')} />
          <TextField label="Pincode" {...register('pincode')} />

          <Select
            label="State"
            {...register('stateCode', {
              onChange: (e) => {
                const selected = INDIAN_STATES.find((s) => s.code === e.target.value);
                e.target.form.elements['state'].value = selected?.name || '';
              },
            })}
          >
            <option value="">Select state</option>
            {INDIAN_STATES.map((s) => (
              <option key={s.code} value={s.code}>
                {s.name}
              </option>
            ))}
          </Select>
          <TextField label="Invoice prefix" placeholder="INV" {...register('invoicePrefix')} />
          <input type="hidden" {...register('state')} />

          <div className="sm:col-span-2 flex justify-end pt-2">
            <Button type="submit" isLoading={isSubmitting || updateMutation.isPending}>
              Save profile
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
