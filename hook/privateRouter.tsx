import { ROLES } from "@/utils/constant.utils";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

const PrivateRouter = (WrappedComponent, allowedRoles = []) => {
  const PrivateRouteComponent = (props) => {
    const router = useRouter();
    const [authorized, setAuthorized] = useState(false);
    const [checked, setChecked] = useState(false);

    useEffect(() => {
      const token = localStorage.getItem("token");
      const role = localStorage.getItem("group"); // 👈 assuming you store role in localStorage

      if (!token) {
        localStorage.clear();
        sessionStorage.clear();
        router.replace("/auth/signin");
        return;
      }

      if (allowedRoles?.length == 0) {
      } else if (allowedRoles.length > 0 && !allowedRoles.includes(role)) {
        router.replace("/error404"); // or any "Not Found" page
        return;
      }

      setAuthorized(true);
      setChecked(true);
    }, [router]);

    if (!checked) return null; // Avoid flicker while checking

    return authorized ? <WrappedComponent {...props} /> : null;
  };

  PrivateRouteComponent.displayName = `PrivateRouter(${
    WrappedComponent.displayName || WrappedComponent.name || "Component"
  })`;

  return PrivateRouteComponent;
};

export default PrivateRouter;
