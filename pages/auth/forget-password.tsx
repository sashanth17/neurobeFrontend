import { useRouter } from "next/router";
import { useDispatch, useSelector } from "react-redux";
import { IRootState } from "../../store";
import { useEffect, useState } from "react";
import {
  setPageTitle,
  toggleLocale,
  toggleRTL,
} from "../../store/themeConfigSlice";
import BlankLayout from "@/components/Layouts/BlankLayout";
import { useTranslation } from "react-i18next";
import Dropdown from "@/components/Dropdown";
import IconCaretDown from "@/components/Icon/IconCaretDown";
import IconMail from "@/components/Icon/IconMail";
import { Failure, Success, useSetState } from "@/utils/function.utils";
import * as Yup from "yup";
import * as Validation from "@/utils/validation.utils";
import Models from "@/imports/models.import";
import TextInput from "@/components/FormFields/TextInput.component";
import IconLockDots from "@/components/Icon/IconLockDots";
import { Loader } from "lucide-react";

const RecoverIdBox = () => {
  const dispatch = useDispatch();
  useEffect(() => {
    dispatch(setPageTitle("Recover Id Box"));
  });
  const router = useRouter();

  const [state, setState] = useSetState({
    email: "",
    btnLoading: false,
    errors: {},
  });

  const handleSubmit = async () => {
    console.log("✌️handleSubmit --->");
    try {
      setState({ btnLoading: true, errors: {} });
      const body = {
        email: state.email,
      };
      console.log("✌️body --->", body);

      // Assuming Validation.forgotPassword exists
      await Validation.forgotPassword.validate(body, { abortEarly: false });

      const res: any = await Models.auth.forget_password(body);

      setState({
        btnLoading: false,
        email: "",
        errors: {},
      });

      Success(
        res?.message ||
          "Password reset link sent successfully! Please check your email.",
      );

      router.push("/auth/signin");
    } catch (error) {
      setState({ btnLoading: false });
      if (error instanceof Yup.ValidationError) {
        const validationErrors: { [key: string]: string } = {};
        error.inner.forEach((err) => {
          if (err.path) {
            validationErrors[err.path] = err.message;
          }
        });
        console.log("✌️validationErrors --->", validationErrors);

        setState({ errors: validationErrors });
      } else {
        console.log("error", error);
        Failure((error as any).error || "An error occurred. Please try again.");
      }
    }
  };

  const submitForm = (e: any) => {
    e.preventDefault();
    router.push("/");
  };
  const isRtl =
    useSelector((state: IRootState) => state.themeConfig.rtlClass) === "rtl"
      ? true
      : false;

  const themeConfig = useSelector((state: IRootState) => state.themeConfig);
  const setLocale = (flag: string) => {
    setFlag(flag);
    if (flag.toLowerCase() === "ae") {
      dispatch(toggleRTL("rtl"));
    } else {
      dispatch(toggleRTL("ltr"));
    }
  };
  const [flag, setFlag] = useState("");
  useEffect(() => {
    setLocale(localStorage.getItem("i18nextLng") || themeConfig.locale);
  }, []);

  const { t, i18n } = useTranslation();

  return (
    <div>
      <div className="absolute inset-0">
        {/* <img
          src="/assets/images/auth/bg-gradient.png"
          alt="image"
          className="h-full w-full object-cover"
        /> */}
      </div>

      <div className="bg-lblue relative flex min-h-screen items-center justify-center bg-cover bg-center bg-no-repeat px-6 py-10 dark:bg-[#060818] sm:px-16">
        {/* <img
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
        /> */}
        <div className="relative w-full max-w-[600px]  rounded-lg">
          <div className="flex items-center justify-center">
            <img
              src="/assets/images/faculty-logo.png"
              alt=""
              className="mb-10 h-10 w-[200px] text-center"
            />
          </div>
          <div className="relative flex flex-col justify-center rounded-lg bg-white px-6 py-10 backdrop-blur-lg dark:bg-black/50 ">
            {/* <div className="absolute end-6 top-6">
                            <div className="dropdown">
                                {flag && (
                                    <Dropdown
                                        offset={[0, 8]}
                                        placement={`${isRtl ? 'bottom-start' : 'bottom-end'}`}
                                        btnClassName="flex items-center gap-2.5 rounded-lg border border-white-dark/30 bg-white px-2 py-1.5 text-white-dark hover:border-primary hover:text-primary dark:bg-black"
                                        button={
                                            <>
                                                <div>
                                                    <img src={`/assets/images/flags/${flag.toUpperCase()}.svg`} alt="image" className="h-5 w-5 rounded-full object-cover" />
                                                </div>
                                                <div className="text-base font-bold uppercase">{flag}</div>
                                                <span className="shrink-0">
                                                    <IconCaretDown />
                                                </span>
                                            </>
                                        }
                                    >
                                        <ul className="grid w-[280px] grid-cols-2 gap-2 !px-2 font-semibold text-dark dark:text-white-dark dark:text-white-light/90">
                                            {themeConfig.languageList.map((item: any) => {
                                                return (
                                                    <li key={item.code}>
                                                        <button
                                                            type="button"
                                                            className={`flex w-full rounded-lg hover:text-primary ${i18n.language === item.code ? 'bg-primary/10 text-primary' : ''}`}
                                                            onClick={() => {
                                                                dispatch(toggleLocale(item.code));
                                                                i18n.changeLanguage(item.code);
                                                                setLocale(item.code);
                                                            }}
                                                        >
                                                            <img src={`/assets/images/flags/${item.code.toUpperCase()}.svg`} alt="flag" className="h-5 w-5 rounded-full object-cover" />
                                                            <span className="ltr:ml-3 rtl:mr-3">{item.name}</span>
                                                        </button>
                                                    </li>
                                                );
                                            })}
                                        </ul>
                                    </Dropdown>
                                )}
                            </div>
                        </div> */}
            <div className="mx-auto w-full max-w-[440px]">
              <div className="mb-7 text-center">
                <h1 className="text-dblue  text-xl font-extrabold uppercase !leading-snug">
                  Forget Password
                </h1>
                <p>Enter your email to recover your ID</p>
              </div>

              <TextInput
                name="email"
                type="text"
                title="Email"
                placeholder="Enter Email"
                value={state.email}
                onChange={(e) => setState({ email: e.target.value })}
                error={state.errors?.email}
                icon={<IconMail fill={true} />}
              />
              <button
                onClick={() => handleSubmit()}
                type="button"
                className="btn bg-dblue !mt-6 w-full border-0 uppercase text-white shadow-[0_10px_20px_-10px_rgba(67,97,238,0.44)]"
              >
                {state.btnLoading ? (
                  <Loader className="animate-spin" size={20} />
                ) : (
                  "Send Reset Link"
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
RecoverIdBox.getLayout = (page: any) => {
  return <BlankLayout>{page}</BlankLayout>;
};
export default RecoverIdBox;
