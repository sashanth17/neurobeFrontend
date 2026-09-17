import Link from "next/link";
import { useDispatch } from "react-redux";
import { setPageTitle } from "../../store/themeConfigSlice";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import BlankLayout from "@/components/Layouts/BlankLayout";
import IconMail from "@/components/Icon/IconMail";
import IconGoogle from "@/components/Icon/IconGoogle";
import TextInput from "@/components/FormFields/TextInput.component";
import PrimaryButton from "@/components/FormFields/PrimaryButton.component";
import {
  Failure,
  getPasswordStrength,
  Success,
  useSetState,
} from "@/utils/function.utils";
import NumberInput from "@/components/FormFields/NumberInputs.component";
import CustomSelect from "@/components/FormFields/CustomSelect.component";
import Utils from "@/imports/utils.import";
import Models from "@/imports/models.import";
import * as Yup from "yup";
import IconLockDots from "@/components/Icon/IconLockDots";
import IconEyeOff from "@/components/Icon/IconEyeOff";
import IconEye from "@/components/Icon/IconEye";
import { CAPTCHA_SITE_KEY, ROLES } from "@/utils/constant.utils";
import ReCAPTCHA from "react-google-recaptcha";

const RegisterBoxed = () => {
  const dispatch = useDispatch();

  const router = useRouter();

  const [loginCaptchaToken, setLoginCaptchaToken] = useState("");
  

  const [state, setState] = useSetState({
    showPassword: false,
    assignRole: null,
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    password: "",
    passwordStrength: "",
    btnLoading: false,
  });

  useEffect(() => {
    dispatch(setPageTitle("Register"));
  });

  const submitForm = async (e: any) => {
    e.preventDefault();
    try {
      setState({ btnLoading: true });
      const body = {
        email: state.email.trim(),
        first_name: state.first_name,
        last_name: state.last_name,
        phone: state.phone,
        user_type: state.assignRole?.value,
        password: state.password,
        terms_accepted:true,
        recaptcha_token: loginCaptchaToken,
      };
      console.log("✌️body --->", body);

      await Utils.Validation.signin.validate(body, { abortEarly: false });
      const res: any = await Models.auth.singup(body);
      Success("Register Successfully");
      // localStorage.setItem("token", res.access);
      // localStorage.setItem("refresh", res.refresh);
      // localStorage.setItem("userId", res.user_id);
      // if (res?.groups?.length > 0) {
      //   localStorage.setItem("group", res.groups[0]);
      // }
      router.replace("/auth/signin");
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setState({
      [name]: value,
      error: { ...state.error, [name]: "" },
    });
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
                  Sign Up
                </h1>
                <p className="text-base font-bold leading-normal text-white-dark">
                  Enter your details to register
                </p>
              </div>
              <form className="space-y-5 dark:text-white" onSubmit={submitForm}>
                <TextInput
                  name="first_name"
                  type="text"
                  title="First Name"
                  placeholder="Enter Email"
                  value={state.first_name}
                  onChange={handleInputChange}
                  error={state.error?.first_name}
                  icon={<IconMail fill={true} />}
                  required
                />
                <TextInput
                  name="last_name"
                  type="text"
                  title="Last Name"
                  placeholder="Enter Email"
                  value={state.last_name}
                  onChange={handleInputChange}
                  error={state.error?.last_name}
                  icon={<IconMail fill={true} />}
                  required
                />
                <TextInput
                  name="email"
                  type="email"
                  title="Email"
                  placeholder="Enter Email"
                  value={state.email}
                  onChange={handleInputChange}
                  error={state.error?.email}
                  icon={<IconMail fill={true} />}
                  required
                />
                <NumberInput
                  name="phone"
                  title="Phone Number"
                  value={state.phone}
                  onChange={handleInputChange}
                  placeholder={"Phone Number"}
                  error={state.error?.phone}
                  required
                />
                <CustomSelect
                  value={state.assignRole}
                  onChange={(e) =>
                    setState({
                      assignRole: e,

                      error: { ...state.error, user_type: "" },
                    })
                  }
                  placeholder={"Select Role"}
                  title={"Choose Role"}
                  options={[
                    { value: "buyer", label: "Buyer" },
                    { value: "seller", label: "Seller" },
                    { value: "developer", label: "Developer" },
                    { value: "agent", label: "Agent" },

                  ]}
                  required
                  error={state.error?.user_type}
                />
                <TextInput
                  id="Password"
                  title="Password"
                  type={state.showPassword ? "text" : "password"}
                  placeholder="Enter Password"
                  className="form-input ps-10 placeholder:text-white-dark"
                  onChange={(e) => {
                    const value = e.target.value;
                    setState({
                      password: e.target.value,
                      error: { ...state.error, password: "" },
                      passwordStrength: getPasswordStrength(value),
                    });
                  }}
                  value={state.password}
                  error={state.error?.password}
                  icon={<IconLockDots fill={true} />}
                  rightIcon={state.showPassword ? <IconEyeOff /> : <IconEye />}
                  rightIconOnlick={() =>
                    setState({ showPassword: !state.showPassword })
                  }
                />

                {state.password && (
                  <p
                    className={` text-sm ${
                      state.passwordStrength === "weak"
                        ? "text-red-500"
                        : state.passwordStrength === "medium"
                        ? "text-yellow-500"
                        : "text-green-600"
                    }`}
                  >
                    {state.passwordStrength === "weak" && "Weak password"}
                    {state.passwordStrength === "medium" && "Medium strength"}
                    {state.passwordStrength === "strong" && "Strong password"}
                  </p>
                )}

                {/* <TextInput
                  id="Password"
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
                /> */}

                {/* <button
                  type="submit"
                  className="btn btn-gradient !mt-6 w-full border-0 uppercase shadow-[0_10px_20px_-10px_rgba(67,97,238,0.44)]"
                >
                  Sign in
                </button> */}
                {/* <PrimaryButton text={"Sign In"} /> */}

                <div className="flex w-full items-center justify-center py-2">
                <ReCAPTCHA
                  sitekey={CAPTCHA_SITE_KEY}
                  onChange={(token) => setLoginCaptchaToken(token || "")}
                />
                </div>

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
                Already have an account ?&nbsp;
                <Link
                  href="/auth/signin"
                  className="uppercase text-primary underline transition hover:text-black dark:hover:text-white"
                >
                  SIGN IN
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
RegisterBoxed.getLayout = (page: any) => {
  return <BlankLayout>{page}</BlankLayout>;
};
export default RegisterBoxed;
