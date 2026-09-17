import Link from "next/link";
import { useDispatch } from "react-redux";
import { useEffect } from "react";
import { setPageTitle } from "../../store/themeConfigSlice";
import { useRouter } from "next/router";
import BlankLayout from "@/components/Layouts/BlankLayout";
import IconMail from "@/components/Icon/IconMail";
import IconLockDots from "@/components/Icon/IconLockDots";
import IconInstagram from "@/components/Icon/IconInstagram";
import IconFacebookCircle from "@/components/Icon/IconFacebookCircle";
import IconTwitter from "@/components/Icon/IconTwitter";
import IconGoogle from "@/components/Icon/IconGoogle";
import TextInput from "@/components/FormFields/TextInput.component";
import { Failure, Success, useSetState } from "@/utils/function.utils";
import IconEye from "@/components/Icon/IconEye";
import IconEyeOff from "@/components/Icon/IconEyeOff";
import Utils from "@/imports/utils.import";
import * as Yup from "yup";
import Models from "@/imports/models.import";
import PrimaryButton from "@/components/FormFields/PrimaryButton.component";
import { userData } from "@/store/userConfigSlice";

const LoginBoxed = () => {
  const dispatch = useDispatch();
  const router = useRouter();

  const [state, setState] = useSetState({
    showPassword: false,
    email: "",
    password: "",
    error: null,
    btnLoading: false,
  });

  useEffect(() => {
    dispatch(setPageTitle("Login"));
  });

  const submitForm = async (e: any) => {
    e.preventDefault();
    try {
      setState({ btnLoading: true });
      const body = {
        email: state.email.trim(),
        password: state.password,
      };

      await Utils.Validation.login.validate(body, { abortEarly: false });
      const res: any = await Models.auth.login(body);
      Success("Login Successfully");
      localStorage.setItem("token", res.access);
      localStorage.setItem("refresh", res.refresh);
      localStorage.setItem("userId", res.user?.id);
      localStorage.setItem("role", res.user?.role);
      router.replace("/");
      setState({ btnLoading: false });
    } catch (error) {
      if (error instanceof Yup.ValidationError) {
        const validationErrors = {};
        error.inner.forEach((err) => {
          validationErrors[err.path] = err?.message;
        });
        console.log("✌️validationErrors --->", validationErrors);

        setState({ error: validationErrors, btnLoading: false });
      } else {
        Failure(error?.error);
        setState({ btnLoading: false });
      }
    }
  };

  return (
    <div>
      <div className="absolute inset-0">
        <img
          src="/assets/images/auth/bg-gradient.png"
          alt="image"
          className="h-full w-full object-cover"
        />
      </div>

      <div className="relative flex min-h-screen items-center justify-center bg-[url(/assets/images/auth/map.png)] bg-cover bg-center bg-no-repeat px-6 py-10 dark:bg-[#060818] sm:px-16">
        <img
          src="/assets/images/auth/coming-soon-object1.png"
          alt="image"
          className="absolute left-0 top-1/2 h-full max-h-[893px] -translate-y-1/2"
        />
        <img
          src="/assets/images/auth/coming-soon-object2.png"
          alt="image"
          className="absolute left-24 top-0 h-40 md:left-[30%]"
        />
        <img
          src="/assets/images/auth/coming-soon-object3.png"
          alt="image"
          className="absolute right-0 top-0 h-[300px]"
        />
        <img
          src="/assets/images/auth/polygon-object.svg"
          alt="image"
          className="absolute bottom-0 end-[28%]"
        />
        <div className="relative w-full max-w-[870px] rounded-md bg-[linear-gradient(45deg,#fff9f9_0%,rgba(255,255,255,0)_25%,rgba(255,255,255,0)_75%,_#fff9f9_100%)] p-2 dark:bg-[linear-gradient(52.22deg,#0E1726_0%,rgba(14,23,38,0)_18.66%,rgba(14,23,38,0)_51.04%,rgba(14,23,38,0)_80.07%,#0E1726_100%)]">
          <div className="relative flex flex-col justify-center rounded-md bg-white/60 px-6 py-20 backdrop-blur-lg dark:bg-black/50 lg:min-h-[758px]">
            <div className="mx-auto w-full max-w-[440px]">
              <div className="mb-10">
                <h1 className="text-3xl font-extrabold uppercase !leading-snug text-primary md:text-4xl">
                  Sign in
                </h1>
                <p className="text-base font-bold leading-normal text-white-dark">
                  Enter your email and password to login
                </p>
              </div>
              <form className="space-y-5 dark:text-white" onSubmit={submitForm}>
                <TextInput
                  name="email"
                  type="text"
                  title="Email"
                  placeholder="Enter Email"
                  value={state.email}
                  onChange={(e) => setState({ email: e.target.value })}
                  error={state.error?.email}
                  icon={<IconMail fill={true} />}
                />
                <TextInput
                  id="Password"
                  title="Password"
                  type={state.showPassword ? "text" : "password"}
                  placeholder="Enter Password"
                  className="form-input ps-10 placeholder:text-white-dark"
                  onChange={(e) => setState({ password: e.target.value })}
                  value={state.password}
                  error={state.error?.password}
                  icon={<IconLockDots fill={true} />}
                  rightIcon={state.showPassword ? <IconEyeOff /> : <IconEye />}
                  rightIconOnlick={() =>
                    setState({ showPassword: !state.showPassword })
                  }
                />

                {/* <button
                  type="submit"
                  className="btn btn-gradient !mt-6 w-full border-0 uppercase shadow-[0_10px_20px_-10px_rgba(67,97,238,0.44)]"
                >
                  Sign in
                </button> */}
                {/* <PrimaryButton text={"Sign In"} /> */}
                <PrimaryButton
                  type="submit"
                  text="Submit"
                  className="btn btn-gradient !mt-6 w-full border-0 uppercase shadow-[0_10px_20px_-10px_rgba(67,97,238,0.44)]"
                  loading={state.btnLoading}
                />
              </form>
              <div className="relative my-7 text-center md:mb-9">
                <span className="absolute inset-x-0 top-1/2 h-px w-full -translate-y-1/2 bg-white-light dark:bg-white-dark"></span>
                <span className="relative bg-white px-2 font-bold uppercase text-white-dark dark:bg-dark dark:text-white-light">
                  or
                </span>
              </div>
              <div className="mb-10 md:mb-[60px]">
                <ul className="flex justify-center gap-3.5 text-white">
                  {/* <li>
                    <Link
                      href="#"
                      className="inline-flex h-8 w-8 items-center justify-center rounded-full p-0 transition hover:scale-110"
                      style={{
                        background:
                          "linear-gradient(135deg, rgba(239, 18, 98, 1) 0%, rgba(67, 97, 238, 1) 100%)",
                      }}
                    >
                      <IconInstagram />
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="#"
                      className="inline-flex h-8 w-8 items-center justify-center rounded-full p-0 transition hover:scale-110"
                      style={{
                        background:
                          "linear-gradient(135deg, rgba(239, 18, 98, 1) 0%, rgba(67, 97, 238, 1) 100%)",
                      }}
                    >
                      <IconFacebookCircle />
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="#"
                      className="inline-flex h-8 w-8 items-center justify-center rounded-full p-0 transition hover:scale-110"
                      style={{
                        background:
                          "linear-gradient(135deg, rgba(239, 18, 98, 1) 0%, rgba(67, 97, 238, 1) 100%)",
                      }}
                    >
                      <IconTwitter fill={true} />
                    </Link>
                  </li> */}
                  <li>
                    <Link
                      href="#"
                      className="inline-flex h-8 w-8 items-center justify-center rounded-full p-0 transition hover:scale-110"
                      style={{
                        background:
                          "linear-gradient(135deg, rgba(239, 18, 98, 1) 0%, rgba(67, 97, 238, 1) 100%)",
                      }}
                    >
                      <IconGoogle />
                    </Link>
                  </li>
                </ul>
              </div>
              <div className="text-center dark:text-white">
                Don't have an account ?&nbsp;
                <Link
                  href="/auth/signup"
                  className="uppercase text-primary underline transition hover:text-black dark:hover:text-white"
                >
                  SIGN UP
                </Link>
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
