import Link from 'next/link';
import { useDispatch } from 'react-redux';
import { useEffect } from 'react';
import { setPageTitle } from '../../store/themeConfigSlice';
import { useRouter } from 'next/router';
import BlankLayout from '@/components/Layouts/BlankLayout';
import IconMail from '@/components/Icon/IconMail';
import IconLockDots from '@/components/Icon/IconLockDots';
import IconFacebookCircle from '@/components/Icon/IconFacebookCircle';
import IconGoogle from '@/components/Icon/IconGoogle';
import TextInput from '@/components/FormFields/TextInput.component';
import { Failure, Success, useSetState } from '@/utils/function.utils';
import IconEye from '@/components/Icon/IconEye';
import IconEyeOff from '@/components/Icon/IconEyeOff';
import Utils from '@/imports/utils.import';
import * as Yup from 'yup';
import Models from '@/imports/models.import';
import PrimaryButton from '@/components/FormFields/PrimaryButton.component';

const LoginBoxed = () => {
  const dispatch = useDispatch();
  const router = useRouter();

  const [state, setState] = useSetState({
    showPassword: false,
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    error: null,
    btnLoading: false,
    activeTab: 'login', // 'login' or 'signup'
  });

  useEffect(() => {
    dispatch(setPageTitle(state.activeTab === 'login' ? 'Login' : 'Sign Up'));
  });

  // Create signup validation schema
  const signupValidationSchema = Yup.object({
    first_name: Yup.string().required('First name is required'),
    last_name: Yup.string().required('Last name is required'),
    email: Yup.string()
      .email('Invalid email address')
      .required('Email is required'),
    password: Yup.string()
      .min(6, 'Password must be at least 6 characters')
      .required('Password is required'),
  });

  const submitForm = async (e: any) => {
    e.preventDefault();
    try {
      setState({ btnLoading: true, error: null });

      if (state.activeTab === 'login') {
        // Login logic
        const body = {
          email: state.email.trim(),
          password: state.password,
        };

        await Utils.Validation.login.validate(body, { abortEarly: false });
        const res: any = await Models.auth.login(body);
        Success('Login Successfully');
        localStorage.setItem('token', res.access);
        localStorage.setItem('refresh', res.refresh);
        localStorage.setItem('userId', res.user_id);
        if (res?.groups?.length > 0) {
          localStorage.setItem('group', res.groups[0]?.name);
        }
        router.replace('/');
      } else {
        // Signup logic
        const body = {
          first_name: state.firstName.trim(),
          last_name: state.lastName.trim(),
          email: state.email.trim(),
          password: state.password,
        };

        console.log('Signup body:', body);
        console.log('Available auth methods:', Object.keys(Models.auth));

        await signupValidationSchema.validate(body, { abortEarly: false });

        let res: any;

        // Use the correct method name - it's 'singup' not 'signup'
        if (Models.auth.singup && typeof Models.auth.singup === 'function') {
          console.log('Using Models.auth.singup');
          res = await Models.auth.singup(body);
        } else {
          // Fallback to other method names if needed
          const availableMethods = Object.keys(Models.auth);
          console.error(
            'Singup method not found. Available methods:',
            availableMethods
          );
          const functionMethods = availableMethods.filter(
            (method) => typeof Models.auth[method] === 'function'
          );
          throw new Error(
            `Signup functionality not available. Found methods: ${functionMethods.join(
              ', '
            )}`
          );
        }

        console.log('Signup response:', res);
        Success('Signup Successful');

        // Clear form and switch to login tab
        setState({
          activeTab: 'login',
          email: '',
          password: '',
          firstName: '',
          lastName: '',
          error: null,
        });

        Success('Please login with your new account');
      }

      setState({ btnLoading: false }); // Moved this outside the else block
    } catch (error) {
      if (error instanceof Yup.ValidationError) {
        const validationErrors = {};
        error.inner.forEach((err) => {
          validationErrors[err.path] = err?.message;
        });
        console.log('✌️validationErrors --->', validationErrors);

        setState({ error: validationErrors, btnLoading: false });
      } else {
        Failure(error?.error || error?.message || 'Something went wrong');
        setState({ btnLoading: false });
      }
    }
  };

  const clearForm = () => {
    setState({
      email: '',
      password: '',
      firstName: '',
      lastName: '',
      error: null,
    });
  };

  return (
    <div>
      <div className='absolute inset-0'>
        <img
          src='/assets/images/auth/bg-gradient.png'
          alt='image'
          className='h-full w-full object-cover'
        />
      </div>

      <div className='relative flex min-h-screen items-center justify-center bg-[url(/assets/images/auth/map.png)] bg-cover bg-center bg-no-repeat px-6 py-10 dark:bg-[#060818] sm:px-16'>
        <img
          src='/assets/images/auth/coming-soon-object1.png'
          alt='image'
          className='absolute left-0 top-1/2 h-full max-h-[893px] -translate-y-1/2'
        />
        <img
          src='/assets/images/auth/coming-soon-object2.png'
          alt='image'
          className='absolute left-24 top-0 h-40 md:left-[30%]'
        />
        <img
          src='/assets/images/auth/coming-soon-object3.png'
          alt='image'
          className='absolute right-0 top-0 h-[300px]'
        />
        <img
          src='/assets/images/auth/polygon-object.svg'
          alt='image'
          className='absolute bottom-0 end-[28%]'
        />
        <div className='relative w-full max-w-[870px] rounded-md bg-[linear-gradient(45deg,#fff9f9_0%,rgba(255,255,255,0)_25%,rgba(255,255,255,0)_75%,_#fff9f9_100%)] p-2 dark:bg-[linear-gradient(52.22deg,#0E1726_0%,rgba(14,23,38,0)_18.66%,rgba(14,23,38,0)_51.04%,rgba(14,23,38,0)_80.07%,#0E1726_100%)]'>
          <div className='relative flex flex-col justify-center rounded-md bg-white/60 px-6 py-20 backdrop-blur-lg dark:bg-black/50 lg:min-h-[758px]'>
            <div className='mx-auto w-full max-w-[440px]'>
              {/* Tab Navigation */}
              <div className='mb-10'>
                <div className='flex border-b border-gray-200 dark:border-gray-700'>
                  <button
                    type='button'
                    className={`flex-1 py-4 text-center text-lg font-semibold transition-all ${
                      state.activeTab === 'login'
                        ? 'border-b-2 border-primary text-primary'
                        : 'text-[#000] hover:text-[#000] dark:text-[#000] dark:hover:text-gray-300'
                    }`}
                    onClick={() => {
                      setState({ activeTab: 'login' });
                      clearForm();
                    }}
                  >
                    Login
                  </button>
                  <button
                    type='button'
                    className={`flex-1 py-4 text-center text-lg font-semibold transition-all ${
                      state.activeTab === 'signup'
                        ? 'border-b-2 border-primary text-primary'
                        : 'text-[#000] hover:text-[#000] dark:text-[#000] dark:hover:text-gray-300'
                    }`}
                    onClick={() => {
                      setState({ activeTab: 'signup' });
                      clearForm();
                    }}
                  >
                    Sign Up
                  </button>
                </div>
              </div>

              <div className='mb-10 text-center'>
                <h1 className='text-3xl font-extrabold uppercase !leading-snug text-primary md:text-4xl'>
                  {state.activeTab === 'login' ? 'LOGIN' : 'SIGN UP'}
                </h1>
                <p className='mt-2 text-base font-bold leading-normal text-white-dark'>
                  {state.activeTab === 'login'
                    ? 'Enter your email and password to login'
                    : 'Create your account to get started'}
                </p>
              </div>

              <form className='space-y-6 dark:text-white' onSubmit={submitForm}>
                {/* Signup Fields - Only show for signup */}
                {state.activeTab === 'signup' && (
                  <div className='grid grid-cols-2 gap-4'>
                    <TextInput
                      name='firstName'
                      type='text'
                      title='First name'
                      placeholder='Enter First Name'
                      value={state.firstName}
                      onChange={(e) => setState({ firstName: e.target.value })}
                      error={state.error?.first_name}
                    />
                    <TextInput
                      name='lastName'
                      type='text'
                      title='Last name'
                      placeholder='Enter Last Name'
                      value={state.lastName}
                      onChange={(e) => setState({ lastName: e.target.value })}
                      error={state.error?.last_name}
                    />
                  </div>
                )}

                {/* Email and Password in same line */}
                <div className='grid grid-cols-2 gap-4'>
                  <TextInput
                    name='email'
                    type='email'
                    title='Email'
                    placeholder='Enter Email'
                    value={state.email}
                    onChange={(e) => setState({ email: e.target.value })}
                    error={state.error?.email}
                    icon={<IconMail fill={true} />}
                  />

                  <TextInput
                    id='Password'
                    title='Password'
                    type={state.showPassword ? 'text' : 'password'}
                    placeholder='Enter Password'
                    className='form-input ps-10 placeholder:text-white-dark'
                    onChange={(e) => setState({ password: e.target.value })}
                    value={state.password}
                    error={state.error?.password}
                    icon={<IconLockDots fill={true} />}
                    rightIcon={
                      state.showPassword ? <IconEyeOff /> : <IconEye />
                    }
                    rightIconOnlick={() =>
                      setState({ showPassword: !state.showPassword })
                    }
                  />
                </div>

                {/* Remember me and Forgot password - Only for login */}
                {state.activeTab === 'login' && (
                  <div className='flex items-center justify-between'>
                    <label className='flex items-center'>
                      <input
                        type='checkbox'
                        className='form-checkbox rounded border-gray-300 text-primary focus:ring-primary dark:border-gray-600 dark:bg-gray-800'
                      />
                      <span className='ml-2 text-sm text-[#000] dark:text-gray-300'>
                        Remember me
                      </span>
                    </label>
                    <Link
                      href='/auth/forgot-password'
                      className='text-sm text-primary underline transition hover:text-black dark:hover:text-white'
                    >
                      Forgot your password?
                    </Link>
                  </div>
                )}

                <PrimaryButton
                  type='submit'
                  text={state.activeTab === 'login' ? 'SUBMIT' : 'SIGN UP'}
                  className='btn btn-gradient !mt-6 w-full border-0 py-3 font-semibold uppercase shadow-[0_10px_20px_-10px_rgba(67,97,238,0.44)] transition-all hover:shadow-lg'
                  loading={state.btnLoading}
                />
              </form>

              <div className='relative my-7 text-center md:mb-9'>
                <span className='absolute inset-x-0 top-1/2 h-px w-full -translate-y-1/2 bg-white-light dark:bg-white-dark'></span>
                <span className='relative bg-white px-4 font-bold uppercase text-white-dark dark:bg-dark dark:text-white-light'>
                  OR
                </span>
              </div>

              {/* Social Login Buttons - Moved to bottom */}
              <div className='mb-10'>
                <ul className='flex justify-center gap-3.5 text-white'>
                  <li>
                    <button
                      type='button'
                      className='inline-flex h-8 w-8 items-center justify-center rounded-full p-0 transition hover:scale-110'
                      style={{
                        background:
                          'linear-gradient(135deg, rgba(239, 18, 98, 1) 0%, rgba(67, 97, 238, 1) 100%)',
                      }}
                    >
                      <IconFacebookCircle />
                    </button>
                  </li>
                  <li>
                    <button
                      type='button'
                      className='inline-flex h-8 w-8 items-center justify-center rounded-full p-0 transition hover:scale-110'
                      style={{
                        background:
                          'linear-gradient(135deg, rgba(239, 18, 98, 1) 0%, rgba(67, 97, 238, 1) 100%)',
                      }}
                    >
                      <IconGoogle />
                    </button>
                  </li>
                </ul>
              </div>

              <div className='text-center dark:text-white'>
                <span className='text-[#000] dark:text-[#000]'>
                  {state.activeTab === 'login'
                    ? "Don't have an account? "
                    : 'Already have an account? '}
                </span>
                <button
                  type='button'
                  className='font-semibold text-primary underline transition hover:text-black dark:hover:text-white'
                  onClick={() => {
                    setState({
                      activeTab:
                        state.activeTab === 'login' ? 'signup' : 'login',
                    });
                    clearForm();
                  }}
                >
                  {state.activeTab === 'login' ? 'SIGN UP' : 'LOGIN'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

LoginBoxed.getLayout = (page: any) => {
  return <BlankLayout>{page}</BlankLayout>;
};

export default LoginBoxed;
