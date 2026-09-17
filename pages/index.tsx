import { useEffect } from "react";
import { useRouter } from "next/router";
import { getDefaultRouteByRole } from "@/utils/constant.utils";

const Index = () => {
  const router = useRouter();
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.replace("/auth/signin");
      return;
    }
    const role = localStorage.getItem("role") || localStorage.getItem("group") || "";
    router.replace(getDefaultRouteByRole(role));
  }, [router]);
  return null;
};

export default Index;
