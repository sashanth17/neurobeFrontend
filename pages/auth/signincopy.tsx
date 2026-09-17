import React, { useState } from "react";
import Link from "next/link";
// Importing specific icons from lucide-react (keeping your existing imports)
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  User,
  Twitter,
  Search,
  Key,
} from "lucide-react";
// CORRECTED Import for FaGoogle: Using the standard 'fa' submodule
import { FaGoogle } from "react-icons/fa";
// Assuming BlankLayout is available at this path, based on your old code
import BlankLayout from "@/components/Layouts/BlankLayout";
import PrimaryButton from "@/components/FormFields/PrimaryButton.component";

const LoginCover = () => {
  const [passwordVisible, setPasswordVisible] = useState(false);

  // Determines which icon to display for password visibility
  const EyeIcon = passwordVisible ? EyeOff : Eye;

  // The image style is achieved using a background image and overlay in the left pane.
  const leftPaneStyle = {
    // Use the path to the abstract city image from your latest screenshot (image_c57ae8.jpg)
    backgroundImage: "url('/assets/images/real-estate/loginpage.jpg')",
    backgroundSize: "cover",
    backgroundPosition: "center",
  };

  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-2">
      {/* Left Panel: Design & Image */}
      <div
        className="relative hidden flex-col items-start justify-center p-16 text-white lg:flex xl:p-24"
        style={leftPaneStyle}
      >
        {/* Dark Overlay with Red Tints */}
        <div className="absolute inset-0 bg-black bg-opacity-40"></div>

        {/* Content */}
        <div className="relative z-10 max-w-lg">
          {/* The prominent white dot is simulated here */}
          <span className="mb-6 inline-block h-3 w-3 rounded-full bg-white"></span>

          <h1 className="mb-4 text-5xl font-extrabold leading-tight">
            Design with us
          </h1>
          <p className="text-base text-gray-300">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Morbi
            lobortis maximus nunc, ac rhoncus odio congue quis. Sed ac semper
            orci, eu porttitor lacus.
          </p>
        </div>
      </div>

      {/* Right Panel: Sign In Form */}
      <>
      
        <div className="flex items-center justify-center bg-white lg:bg-gray-50">
          <div className="w-full max-w-lg">
            {/* Top Sign Up link */}

            <h2 className="mb-10 text-4xl font-light text-[#000]">Sign in</h2>

            {/* Social Login Buttons */}
            <div className="mb-8 space-y-4">
              {/* Google Button - Using FaGoogle with corrected import */}
              <button
                type="button"
                className="flex w-full items-center justify-center rounded-[50px] border border-black py-3 text-sm font-medium text-[#000] transition duration-150 hover:bg-gray-100"
              >
                {/* FaGoogle is styled red to match the minimal look */}
                {/* <FaGoogle className="mr-3 h-5 w-5 text-red-500" /> */}
                Continue with Google
              </button>

              {/* Twitter Button */}
              <button
                type="button"
                className="flex w-full items-center justify-center rounded-[50px] border border-black py-3 text-sm font-medium text-[#000] transition duration-150 hover:bg-gray-100"
              >
                <Twitter className="mr-3 h-5 w-5 text-sky-500" />
                Continue with Twitter
              </button>
            </div>

            {/* OR Separator */}
            <div className="my-6 flex items-center">
              <div className="flex-grow border-t border-gray-300"></div>
              <span className="mx-4 flex-shrink text-xs font-medium text-[#000]">
                OR
              </span>
              <div className="flex-grow border-t border-gray-300"></div>
            </div>

            {/* Login Form */}
            <form className="space-y-6">
              {/* User name or email address Input */}
              <div>
                <label
                  htmlFor="email"
                  className="mb-1 block text-sm font-light text-[#000]"
                >
                  User name or email address
                </label>
                <div className="relative">
                  <input
                    id="email"
                    name="email"
                    type="text"
                    placeholder=""
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm placeholder-gray-400 outline-none focus:border-gray-700 focus:ring-1 focus:ring-gray-700"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div>
                <div className="mb-1 flex items-center justify-between">
                  <label
                    htmlFor="password"
                    className="block text-sm font-light text-[#000]"
                  >
                    Your password
                  </label>
                  <button
                    type="button"
                    onClick={() => setPasswordVisible(!passwordVisible)}
                    className="flex items-center text-xs font-semibold text-[#000] hover:text-[#000]"
                  >
                    <span className="mr-1">Hide</span>
                    <EyeIcon className="h-4 w-4 text-[#000]" />
                  </button>
                </div>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={passwordVisible ? "text" : "password"}
                    placeholder=""
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm placeholder-gray-400 outline-none focus:border-gray-700 focus:ring-1 focus:ring-gray-700"
                  />
                </div>
                <div className="mt-2 text-right">
                  <Link
                    href="/auth/forgot-password"
                    className="text-xs text-[#000] hover:text-[#000] hover:underline"
                  >
                    Forget your password
                  </Link>
                </div>
              </div>

              {/* Sign In Button (Soft Gray) */}
              <PrimaryButton
                type="submit"
                className="mt-8 w-full rounded-lg py-3 text-lg font-medium text-white shadow-md transition duration-150  hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50"
              >
                Sign in
              </PrimaryButton>
            </form>
          </div>
        </div>
      </>
    </div>
  );
};

// Apply the BlankLayout to remove the default header/sidebar
LoginCover.getLayout = (page) => {
  return <BlankLayout>{page}</BlankLayout>;
};

export default LoginCover;
