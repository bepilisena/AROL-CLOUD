import axios, { AxiosError } from "axios";
import React from "react";

function handleAxiosExceptionWithToast(exception: any, toast: any, toastMessage: string) {
  try {
    if (axios.isAxiosError(exception)) {
      const error = exception as AxiosError<any>;
      console.log(error.response);
      if (!error.response) return;

      if (error.response.status === 401) {
        return;
      } else if (error.response.status === 403) {
        toast({
          title: toastMessage ? toastMessage : "Operation not permitted",
          variant: "left-accent",
          status: "error",
          position: "top-right",
          isClosable: true,
        });
      } else {
        toast({
          title: toastMessage,
          variant: "left-accent",
          status: "error",
          position: "top-right",
          isClosable: true,
        });
      }
    }
  } catch (e) {
    console.log("Exception in AXIOS exception handler", e);
  }

  return;
}

function handleAxiosExceptionWithSetState(
  exception: any,
  setState: React.Dispatch<React.SetStateAction<any>>,
  newState: any,
  newStateForbidden: any,
) {
  try {
    if (axios.isAxiosError(exception)) {
      let error = exception as AxiosError<any>;
      if (!error.response) return;

      if (error.response.status === 401) {
        return;
      } else if (error.response.status === 403) {
        setState(newStateForbidden);
      } else {
        setState(newState);
      }
    }
  } catch (e) {
    console.log("Exception in AXIOS exception handler", e);
  }

  return;
}

function handleAxiosExceptionForLoginWithSetState(
  exception: any,
  setState: React.Dispatch<React.SetStateAction<string>>,
) {
  try {
    if (axios.isAxiosError(exception)) {
      let error = exception as AxiosError<{ msg: string }>;
      if (!error.response) return;

      if (error.response && error.response.status === 403) {
        if (error.response.data.msg === "Bad credentials") {
          setState("Wrong email and/or password.");
        } else if (error.response.data.msg === "Account disabled") {
          setState("Your account is disabled.");
        } else {
          setState("Oops! Something went wrong. Please try again.");
        }
      }
    } else {
      setState("Oops! Something went wrong. Please try again.");
    }
  } catch (e) {
    console.log("Exception in AXIOS exception handler", e);
  }

  return;
}

const AxiosExceptionHandler = {
  handleAxiosExceptionWithToast,
  handleAxiosExceptionWithSetState,
  handleAxiosExceptionForLoginWithSetState,
};

export default AxiosExceptionHandler;
