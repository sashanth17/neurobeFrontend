import moment from "moment";
import { useState } from "react";
import Swal from "sweetalert2";

export const useSetState = (initialState: any) => {
  const [state, setState] = useState(initialState);

  const newSetState = (newState: any) => {
    setState((prevState: any) => {
      const patch = typeof newState === "function" ? newState(prevState) : newState;
      return { ...prevState, ...patch };
    });
  };
  return [state, newSetState];
};

export const getOrganizationId = (): number => {
  if (typeof window !== "undefined") {
    try {
      const directOrgId = localStorage.getItem("organization_id");
      if (directOrgId !== null && directOrgId !== undefined && directOrgId !== "") {
        return Number(directOrgId);
      }
      const userStr = localStorage.getItem("user");
      if (userStr) {
        const user = JSON.parse(userStr);
        if (user?.organization_id !== undefined && user?.organization_id !== null) {
          return Number(user.organization_id);
        }
      }
    } catch (e) {
      console.error("Failed to parse organization_id", e);
    }
  }
  return 3;
};

export const Success = (message: string) => {
  const toast = Swal.mixin({
    toast: true,
    position: "top-end",
    showConfirmButton: false,
    timer: 3000,
    customClass: {
      title: "small-font-toast", // Add custom class for font size
    },
  });

  toast.fire({
    icon: "success",
    title: message,
    padding: "10px 20px",
  });
};

export const Failure = (message: string) => {
  const toast = Swal.mixin({
    toast: true,
    position: "top-end",

    showConfirmButton: false,
    timer: 3000,
  });

  toast.fire({
    icon: "error",
    title: message,
    padding: "10px 20px",
  });
};

export const truncateText = (text: string, maxLength: number = 25) => {
  if (!text) return "";

  const capitalized =
    text?.charAt(0).toUpperCase() + text?.slice(1)?.toLowerCase();

  return capitalized.length > maxLength
    ? capitalized?.substring(0, maxLength) + "..."
    : capitalized;
};

export const showDeleteAlert = (onConfirm, onCancel, title) => {
  const swalWithBootstrapButtons = Swal.mixin({
    customClass: {
      confirmButton: "btn confirm", // Add a custom class for the confirm button
      cancelButton: "btn cancel-btn", // Add a custom class for the cancel button
      popup: "sweet-alerts",
    },
    buttonsStyling: false,
    confirmButtonColor: "#1E3786",
    cancelButtonColor: "#d33",
  });

  swalWithBootstrapButtons
    .fire({
      title: title ? title : "Are you sure to cancel order?",
      // text: "You won't be able to Delete this!",
      icon: "warning",
      showCancelButton: true,
      // confirmButtonText: 'Yes, delete it!',
      // cancelButtonText: 'No, cancel!',
      reverseButtons: true,
      padding: "2em",
    })
    .then((result) => {
      if (result.isConfirmed) {
        onConfirm();
      } else if (result.dismiss === Swal.DismissReason.cancel) {
        onCancel();
      }
    });
};

export const getPasswordStrength = (password: string) => {
  if (!password) return "";

  // Weak: <6 chars
  if (password.length < 6) return "weak";

  // Medium: >=6 chars but missing complexity
  const hasNumber = /\d/.test(password);
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasSpecial = /[^a-zA-Z0-9]/.test(password);

  if (hasLetter && hasNumber && hasSpecial && password.length >= 8) {
    return "strong";
  }

  return "medium";
};

export const handlePasswordChange = (value: string) => {
  const hints = {
    length: value.length >= 8,
    number: /\d/.test(value),
    special: /[^a-zA-Z0-9]/.test(value),
  };

  const strength = !value
    ? ""
    : hints.length && hints.number && hints.special
    ? "strong"
    : value.length >= 6
    ? "medium"
    : "weak";
  return strength;
};

export const toISO = (date) => new Date(date).toISOString();

export const objIsEmpty = (obj: object) => {
  for (let key in obj) {
    if (obj.hasOwnProperty(key)) return false;
  }
  return true;
};

export const getDropdownObject = (apiValue: string, optionsArray: any[]) => {
  return optionsArray.find((option) => option.value === apiValue) || null;
};

export const capitalizeFLetter = (string = "") => {
  if (string?.length > 0) {
    return string?.charAt(0)?.toUpperCase() + string?.slice(1);
  }
  return string;
};

export const Dropdown = (arr: any, label: string) => {
  if (!Array.isArray(arr)) return [];
  const array = arr.filter(Boolean).map((item: any) => ({
    value: item?.id,
    label:
      item?.[label] ||
      item?.name ||
      item?.department_name ||
      item?.programme_name ||
      (item?.start_year && item?.end_year ? `${item.start_year} - ${item.end_year}` : "") ||
      "",
  }));
  return array;
};

export const StringDropdown = (label: string) => {
  const data = { value: label, label: capitalizeFLetter(label) };

  return data;
};

export const MultiDropdown = (arr: any, label: string) => {
  const array = arr?.map((item: any) => ({
    value: item?.id,
    name: item[label],
  }));
  return array;
};

export const UserDropdown = (arr: any, labelFn: (item: any) => string) => {
  const array = arr?.map((item: any) => ({
    value: item?.id,
    label: labelFn(item),
  }));
  return array;
};

export const getFileNameFromUrl = (url: string) => {
  const urlObject = new URL(url);
  const pathname = urlObject.pathname;
  const filename = pathname.substring(pathname.lastIndexOf("/") + 1);
  return filename;
};

export const convertUrlToFile = async (url: any, filename: any) => {
  const response = await fetch(url);
  const blob = await response.blob();
  return new File([blob], filename, { type: blob.type });
};

export const urlToFile = async (url, filename = null) => {
  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(
        `Failed to fetch image: ${response.status} ${response.statusText}`
      );
    }

    const blob = await response.blob();

    // Extract filename from URL if not provided
    let finalFilename = filename;
    if (!finalFilename) {
      const urlParts = url.split("/");
      finalFilename = urlParts[urlParts.length - 1] || "image.jpg";
    }

    // Create File object from blob
    return new File([blob], finalFilename, { type: blob.type });
  } catch (error) {
    console.error("Error converting URL to File:", error);
    throw error;
  }
};

export const isValidImageUrl = (url: string) => {
  const imageExtensions = [".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp"];
  return imageExtensions.some((ext) => url?.toLowerCase().endsWith(ext));
};

export const getTimeOnly = (date: Date | null) => {
  return date ? new Date(0, 0, 0, date.getHours(), date.getMinutes()) : null;
};

export const createTime = (date: Date | string | number | null) => {
  const source = date ? new Date(date) : new Date(); // ensure it's a Date object

  if (isNaN(source.getTime())) {
    // fallback in case the date is invalid
    const now = new Date();
    return new Date(0, 0, 0, now.getHours(), now.getMinutes());
  }

  return new Date(0, 0, 0, source.getHours(), source.getMinutes());
};

export const isToday = (date: Date | null) => {
  if (!date) return false;
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
};

export const generateCalendar = (currentMonth) => {
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startingDay = firstDay.getDay();

  const days = [];

  for (let i = 0; i < startingDay; i++) {
    days.push(null);
  }

  for (let i = 1; i <= daysInMonth; i++) {
    days.push(new Date(year, month, i));
  }

  return days;
};

// export const formatDate = (date) => {
//   if (!date) return "";
//   const options = {
//     weekday: "long",
//     year: "numeric",
//     month: "long",
//     day: "numeric",
//   };
//   return date.toLocaleDateString("en-US", options);
// };

export const formatDate = (date: string | Date, pattern: string) => {
  if (!date) return "";
  return moment(date).format(pattern);
};

export const formatNumber = (num) => {
  return Number(num) % 1 === 0 ? parseInt(num) : Number(num);
};

export const transformSlots = (data) => {
  return Object.entries(data).map(([date, slots]) => ({
    date,
    slot: slots,
  }));
};

export const timeFormat = (time) => {
  return time.length > 5 ? time.slice(0, 5) : time;
};

export const getUnmatchedSlots = (firstArr: any[], secondArr: any[]) => {
  return secondArr?.flatMap((event) => {
    const matchedDate = firstArr?.find((f) => f.date === event.date);

    if (!matchedDate) {
      return event.slots?.filter((slot) => !slot.booked);
    }

    const unmatchedSlots = event.slots?.filter((slot) => {
      if (slot.booked) return false;
      const slotTime = slot.start_time?.slice(0, 5);
      return !matchedDate.slot?.includes(slotTime);
    });

    return unmatchedSlots;
  });
};

export const formatTime = (minutes) => {
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    if (remainingMinutes === 0) {
      return `${hours} Hr${hours > 1 ? "s" : ""}`;
    } else {
      return `${hours} Hr${hours > 1 ? "s" : ""} ${remainingMinutes} Min${
        remainingMinutes > 1 ? "s" : ""
      }`;
    }
  } else {
    return `${minutes} Min${minutes > 1 ? "s" : ""}`;
  }
};

export const formatTimeRange = (date, time, intervalMinutes) => {
  // Combine date + time into one datetime string
  const start = moment(`${date} ${time}`, "YYYY-MM-DD HH:mm:ss");
  const end = moment(start).add(intervalMinutes, "minutes");

  return `${start.format("MMMM D, YYYY")} at ${start.format(
    "h:mm A"
  )} - ${end.format("h:mm A")}`;
};

export const getFirstDayOfMonth = (year, month) => {
  return new Date(year, month, 1).getDay();
};

export const getDaysInMonth = (year, month) => {
  return new Date(year, month + 1, 0).getDate();
};

export const isPastEvent = (event) => {
  const end = new Date(`${event.end_date}T${event.end_time}`);
  const now = new Date();
  return end < now;
};

export const isOngoingEvent = (event) => {
  const start = new Date(`${event.start_date}T${event.start_time}`);
  const end = new Date(`${event.end_date}T${event.end_time}`);
  const now = new Date();
  return now >= start && now <= end;
};

export const isFutureEvent = (event) => {
  const start = new Date(`${event.start_date}T${event.start_time}`);
  const now = new Date();
  return start > now;
};

export const extractZoomMeetingId = (url) => {
  if (!url || typeof url !== "string") return null;

  // try using the URL API if it's an absolute URL
  try {
    const u = new URL(url);

    // common pattern: /j/<meetingId>  (meetingId can include hyphens)
    let m = u.pathname.match(/\/j\/([0-9\-]+)/);
    if (m && m[1]) return m[1].replace(/\D/g, ""); // strip non-digits

    // sometimes meeting id sits directly in path segments (rare)
    m =
      u.pathname.match(/\/meeting\/([0-9\-]+)/) ||
      u.pathname.match(/\/m\/([0-9\-]+)/);
    if (m && m[1]) return m[1].replace(/\D/g, "");

    // fallback: look for a long digit sequence anywhere (9-13 digits)
    m = url.match(/([0-9]{9,13})/);
    return m ? m[1] : null;
  } catch (err) {
    // If URL() failed (maybe a partial string), fall back to regex on raw string
    let m = url.match(/\/j\/([0-9\-]+)/);
    if (m && m[1]) return m[1].replace(/\D/g, "");
    m = url.match(/([0-9]{9,13})/);
    return m ? m[1] : null;
  }
};

// export const buildFormData = (data: Record<string, any>): FormData => {
//   const formData = new FormData();

//   Object.entries(data).forEach(([key, value]) => {
//     if (value === null || value === undefined) return;

//     // Arrays
//     if (Array.isArray(value)) {
//       if (value.length === 0) return;
//       // For arrays, send as JSON string to maintain array format
//       formData.append(key, JSON.stringify(value));
//     }
//     // Files / Blobs
//     else if (value instanceof File || value instanceof Blob) {
//       formData.append(key, value);
//     }
//     // Objects → stringify
//     else if (typeof value === "object") {
//       formData.append(key, JSON.stringify(value));
//     }
//     // Primitives
//     else {
//       formData.append(key, String(value));
//     }
//   });

//   return formData;
// };

export const buildFormData = (data: Record<string, any>): FormData => {
  const formData = new FormData();

  Object.entries(data).forEach(([key, value]) => {
    // null or undefined → send as null
    if (value === null || value === undefined) {
      formData.append(key, "null");
    }

    // Arrays
    else if (Array.isArray(value)) {
      formData.append(key, JSON.stringify(value)); // [] or [1,2]
    }

    // Files / Blobs
    else if (value instanceof File || value instanceof Blob) {
      formData.append(key, value);
    }

    // Objects
    else if (typeof value === "object") {
      formData.append(key, JSON.stringify(value));
    }

    // Primitives
    else {
      formData.append(key, String(value));
    }
  });

  return formData;
};

export const getTimeZone = (time) => {
  const tz = time.split(")")[1].trim();
  return tz;
};

export const getTime = (startDate, startTime) => {
  const date = new Date(startDate);
  const time = new Date(startTime);

  // Extract date components from the first date
  const year = date.getFullYear();
  const month = date.getMonth();
  const day = date.getDate();

  // Extract time components from the second date
  const hours = time.getHours();
  const minutes = time.getMinutes();
  const seconds = time.getSeconds();
  const milliseconds = time.getMilliseconds();

  // Create new date with combined values
  const combinedDate = new Date(
    year,
    month,
    day,
    hours,
    minutes,
    seconds,
    milliseconds
  );
  return combinedDate;
};

export const extractTimeFromDateTime = (dateTimeString) => {
  if (!dateTimeString) return null;

  const timeMatch = dateTimeString.match(/(\d{1,2}):(\d{2}):(\d{2})/);
  if (timeMatch) {
    const [hours, minutes, seconds] = timeMatch[0].split(":").map(Number);
    const timeDate = new Date();
    timeDate.setHours(hours, minutes, seconds, 0);
    return timeDate;
  }

  return null;
};

export const formatToINR = (amount) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0, // Remove decimal places
  }).format(amount);
};

export const commonDateFormat = (date) => {
  if (date) {
    return moment(date).format("DD-MM-YYYY");
  } else {
    return "";
  }
};

export const backendDateFormat = (date) => {
  if (date) {
    return moment(date).format("YYYY-MM-DD");
  } else {
    return "";
  }
};

export const formatPhoneNumber = (phone) => {
  if (!phone) return "";

  const cleaned = phone.toString().replace(/\D/g, "");

  if (cleaned.startsWith("91") && cleaned.length === 12) {
    return `+91 ${cleaned.slice(2, 7)} ${cleaned.slice(7)}`;
  }

  if (cleaned.length === 10) {
    return `+91 ${cleaned.slice(0, 5)} ${cleaned.slice(5)}`;
  }

  return phone;
};

export const formatToINRS = (price: number | string): string => {
  const numericPrice = typeof price === "string" ? parseFloat(price) : price;

  if (isNaN(numericPrice)) return "Price not available";

  if (numericPrice >= 10000000) {
    const crValue = numericPrice / 10000000;
    return `₹${crValue % 1 === 0 ? crValue.toFixed(0) : crValue.toFixed(1)} Cr`;
  } else if (numericPrice >= 100000) {
    const lValue = numericPrice / 100000;
    return `₹${lValue % 1 === 0 ? lValue.toFixed(0) : lValue.toFixed(1)} L`;
  } else if (numericPrice >= 1000) {
    const kValue = numericPrice / 1000;
    return `₹${kValue % 1 === 0 ? kValue.toFixed(0) : kValue.toFixed(1)}K`;
  } else {
    return `₹${numericPrice.toLocaleString("en-IN")}`;
  }
};

export const formatPriceRange = (
  minPrice: number | string | null,
  maxPrice: number | string | null
): string => {
  if (minPrice === null && maxPrice === null) {
    return "Price on request";
  }

  if (minPrice === null) {
    return `Max: ${formatToINRS(maxPrice)}`;
  }

  if (maxPrice === null) {
    return `Min: ${formatToINRS(minPrice)}`;
  }

  const numericMin =
    typeof minPrice === "string" ? parseFloat(minPrice) : minPrice;
  const numericMax =
    typeof maxPrice === "string" ? parseFloat(maxPrice) : maxPrice;

  if (isNaN(numericMin) || isNaN(numericMax)) return "Contact for price";

  const formattedMin = formatToINRS(numericMin).replace("₹", "");
  const formattedMax = formatToINRS(numericMax).replace("₹", "");

  return `${formattedMin} - ${formattedMax}`;
};

export const parseApiError = (error: any): string => {
  if (error?.response?.data?.error) {
    const serverError = error.response.data.error;

    // Handle MySQL duplicate entry errors
    if (serverError.includes("Duplicate entry")) {
      if (serverError.includes("email")) {
        const emailMatch = serverError.match(/'([^']+)' for key/);
        const email = emailMatch ? emailMatch[1] : "this email";
        return `Email '${email}' is already registered. Please use a different email.`;
      }
      if (serverError.includes("username")) {
        return "This username is already taken. Please choose a different one.";
      }
      return "Duplicate entry detected. This data already exists.";
    }

    // Return the clean error message
    return serverError;
  }

  if (error?.message?.includes("Network Error")) {
    return "Network error. Please check your connection.";
  }

  return "An error occurred. Please try again.";
};

export const formatScheduleDateTime = (date, time) => {
  const d = new Date(date);

  if (time) {
    const [hours, minutes] = time.split(":");
    d.setHours(hours);
    d.setMinutes(minutes);
  }

  return d.toLocaleString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

export const formatOptions = (lists) => {
  return lists?.flatMap((item) => {
      const children =
          item?.node?.children?.edges?.map((child) => ({
              value: child?.node?.id,
              label: `-- ${child?.node?.name}`,
          })) || [];
      return [{ value: item?.node?.id, label: item?.node?.name }, ...children];
  });
};
