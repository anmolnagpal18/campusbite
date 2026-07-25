import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, Link } from 'react-router-dom';
import authService from '../services/auth';
import collegeService from '../services/college';
import vendorService from '../services/vendor';
import { 
  User as UserIcon, Store, ChefHat, Building, 
  ArrowLeft, Mail, Lock, Eye, EyeOff, ShieldCheck
} from 'lucide-react';
import { Input } from '../components/common/Input';
import { Select } from '../components/common/Select';
import { Button } from '../components/common/Button';
import ROUTES from '../routes/constants';
import toast from 'react-hot-toast';

export const Signup = () => {
  const navigate = useNavigate();
  const [role, setRole] = useState(null);
  const [colleges, setColleges] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [collegeChoice, setCollegeChoice] = useState('select');

  const { register, handleSubmit, watch, formState: { errors } } = useForm();
  const passwordVal = watch('password');

  useEffect(() => {
    const fetchHelpers = async () => {
      try {
        const colRes = await collegeService.getColleges(1);
        // Backend pagination returns results in results list inside "data"
        // Wrapper: { success: true, data: { results: [...] } }
        if (colRes.success && colRes.data.results) {
          setColleges(colRes.data.results);
        }
      } catch (err) {
        console.error('Failed to fetch colleges', err);
      }

      try {
        const venRes = await vendorService.getVendors(1);
        if (venRes.success && venRes.data.results) {
          setVendors(venRes.data.results);
        }
      } catch (err) {
        console.error('Failed to fetch vendors', err);
      }
    };
    fetchHelpers();
  }, []);

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      if (role === 'USER') {
        await authService.signupUser({
          email: data.email,
          password: data.password,
          confirm_password: data.confirm_password
        });
      } else if (role === 'VENDOR') {
        await authService.signupVendor({
          email: data.email,
          password: data.password,
          confirm_password: data.confirm_password,
          college: parseInt(data.college),
          shop_name: data.shop_name,
          shop_area: data.shop_area,
          block: data.block
        });
      } else if (role === 'STAFF') {
        await authService.signupStaff({
          email: data.email,
          password: data.password,
          confirm_password: data.confirm_password,
          vendor: data.vendor // Passing UUID slug directly
        });
      } else if (role === 'COLLEGE_ADMIN') {
        const payload = {
          email: data.email,
          password: data.password,
          confirm_password: data.confirm_password
        };
        if (collegeChoice === 'select') {
          payload.college = parseInt(data.college);
        } else {
          payload.college_name = data.college_name;
          payload.college_city = data.college_city;
        }
        await authService.signupCollegeAdmin(payload);
      }
      toast.success('Account Created Successfully!');
      navigate(ROUTES.LOGIN);
    } catch (err) {
      console.error(err);
      const errorsData = err.response?.data?.errors || err.response?.data;
      if (errorsData) {
        Object.keys(errorsData).forEach(key => {
          toast.error(`${key}: ${errorsData[key]}`);
        });
      } else {
        toast.error('Signup failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const roles = [
    { id: 'USER', title: 'User', desc: 'Order food from campus stalls', icon: <UserIcon className="h-8 w-8 text-purple-400" /> },
    { id: 'VENDOR', title: 'Vendor', desc: 'Manage your campus food stall', icon: <Store className="h-8 w-8 text-emerald-400" /> },
    { id: 'STAFF', title: 'Staff', desc: 'Work at a vendor food stall', icon: <ChefHat className="h-8 w-8 text-amber-400" /> },
    { id: 'COLLEGE_ADMIN', title: 'College Admin', desc: 'Manage campus stalls & approvals', icon: <Building className="h-8 w-8 text-indigo-400" /> }
  ];

  const passRules = {
    required: 'Password is required',
    pattern: {
      value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>])[A-Za-z\d!@#$%^&*(),.?":{}|<>]{8,}$/,
      message: 'Password must be at least 8 characters, with 1 uppercase, 1 lowercase, 1 number, and 1 special character.'
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0c0a14] py-12 px-4 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-1/4 right-1/3 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl"></div>

      <div className="max-w-2xl w-full glass-card p-8 md:p-10 rounded-3xl relative z-10">
        
        {!role ? (
          <div>
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-indigo-300">
                Select Your Role
              </h1>
              <p className="text-gray-400 text-sm mt-2">Choose the type of account you want to create</p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
              {roles.map((r) => (
                <div
                  key={r.id}
                  onClick={() => setRole(r.id)}
                  className="p-6 rounded-2xl bg-white/5 border border-white/5 hover:border-purple-500/50 cursor-pointer transition-all duration-300 group hover:bg-white/10"
                >
                  <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 w-fit mb-4 group-hover:scale-110 transition-transform">
                    {r.icon}
                  </div>
                  <h3 className="text-lg font-bold text-gray-200 group-hover:text-purple-300 transition-colors">{r.title}</h3>
                  <p className="text-gray-400 text-sm mt-2">{r.desc}</p>
                </div>
              ))}
            </div>

            <p className="text-center text-sm text-gray-400">
              Already have an account?{' '}
              <Link to={ROUTES.LOGIN} className="text-purple-400 hover:text-purple-300 font-semibold transition-colors">
                Sign In
              </Link>
            </p>
          </div>
        ) : (
          <div>
            <button
              onClick={() => setRole(null)}
              className="flex items-center gap-2 text-sm text-gray-400 hover:text-white mb-6 group cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
              Back to Role Selection
            </button>
            
            <div className="mb-6">
              <span className="text-xs px-2.5 py-1 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20 font-bold uppercase tracking-wider">
                {role.replace('_', ' ')} REGISTRATION
              </span>
              <h2 className="text-2xl font-bold text-gray-200 mt-3">Create Your Account</h2>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              
              {role === 'VENDOR' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <Select
                      label="Select College"
                      placeholder="Choose College"
                      options={colleges.map((c) => ({ value: c.id, label: `${c.name} (${c.city})` }))}
                      error={errors.college?.message}
                      {...register('college', { required: 'Please select your college' })}
                    />
                  </div>
                  <Input
                    label="Shop Name"
                    placeholder="My Campus Stall"
                    error={errors.shop_name?.message}
                    {...register('shop_name', { required: 'Shop name is required' })}
                  />
                  <Input
                    label="Shop Area"
                    placeholder="Main Canteen"
                    error={errors.shop_area?.message}
                    {...register('shop_area', { required: 'Shop area is required' })}
                  />
                  <div className="sm:col-span-2">
                    <Input
                      label="Block"
                      placeholder="Block C, Ground Floor"
                      error={errors.block?.message}
                      {...register('block', { required: 'Block is required' })}
                    />
                  </div>
                </div>
              )}

              {role === 'STAFF' && (
                <div>
                  <Select
                    label="Select Vendor Shop"
                    placeholder="Choose Stall"
                    options={vendors.map((v) => ({ value: v.uuid, label: `${v.shop_name} (${v.college_name})` }))}
                    error={errors.vendor?.message}
                    {...register('vendor', { required: 'Vendor selection is required' })}
                  />
                </div>
              )}

              {role === 'COLLEGE_ADMIN' && (
                <div className="space-y-4">
                  <div className="flex gap-4 p-1 rounded-xl bg-white/5 border border-white/5 w-fit">
                    <button
                      type="button"
                      onClick={() => setCollegeChoice('select')}
                      className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${collegeChoice === 'select' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'}`}
                    >
                      Select Existing College
                    </button>
                    <button
                      type="button"
                      onClick={() => setCollegeChoice('create')}
                      className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${collegeChoice === 'create' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'}`}
                    >
                      Register New College
                    </button>
                  </div>

                  {collegeChoice === 'select' ? (
                    <Select
                      label="Select College"
                      placeholder="Choose College"
                      options={colleges.map((c) => ({ value: c.id, label: `${c.name} (${c.city})` }))}
                      error={errors.college?.message}
                      {...register('college', { required: collegeChoice === 'select' ? 'Please select your college' : false })}
                    />
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Input
                        label="College Name"
                        placeholder="ABC University"
                        error={errors.college_name?.message}
                        {...register('college_name', { required: collegeChoice === 'create' ? 'College name is required' : false })}
                      />
                      <Input
                        label="City"
                        placeholder="Boston"
                        error={errors.college_city?.message}
                        {...register('college_city', { required: collegeChoice === 'create' ? 'City is required' : false })}
                      />
                    </div>
                  )}
                </div>
              )}

              <Input
                label="Email Address"
                type="email"
                icon={<Mail className="h-5 w-5 text-gray-400" />}
                placeholder="you@campusfood.com"
                error={errors.email?.message}
                {...register('email', { 
                  required: 'Email is required',
                  pattern: { value: /^\S+@\S+$/i, message: 'Invalid email address' }
                })}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="relative">
                  <Input
                    label="Password"
                    type={showPassword ? 'text' : 'password'}
                    icon={<Lock className="h-5 w-5 text-gray-400" />}
                    placeholder="••••••••"
                    error={errors.password?.message}
                    {...register('password', passRules)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-[38px] text-gray-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>

                <div className="relative">
                  <Input
                    label="Confirm Password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    icon={<Lock className="h-5 w-5 text-gray-400" />}
                    placeholder="••••••••"
                    error={errors.confirm_password?.message}
                    {...register('confirm_password', { 
                      required: 'Confirm password is required',
                      validate: (value) => value === passwordVal || 'Passwords do not match'
                    })}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3.5 top-[38px] text-gray-400 hover:text-white"
                  >
                    {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                loading={loading}
                icon={<ShieldCheck className="h-5 w-5" />}
                className="w-full mt-4"
              >
                Create Account
              </Button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default Signup;
