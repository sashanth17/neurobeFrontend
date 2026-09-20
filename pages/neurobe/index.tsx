import { useEffect } from "react";
import { useRouter } from "next/router";
import { getDefaultRouteByRole } from "@/utils/constant.utils";

const NeurobeIndex = () => {
  const router = useRouter();

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) {
      router.replace("/auth/signin");
      return;
    }
    const role = typeof window !== "undefined" ? localStorage.getItem("group") || "" : "";
    router.replace(getDefaultRouteByRole(role));
  }, [router]);

  return null;
};

export default NeurobeIndex;
