import axios, { AxiosRequestConfig, AxiosResponse } from "axios";
import { useContext, useEffect } from "react";
import PrincipalContext from "./contexts/PrincipalContext";
import authService from "../services/AuthService";
import ToastContext from "./contexts/ToastContext";
import { useNavigate } from "react-router-dom";

// axios instance
const instance = axios.create({
  baseURL: "http://localhost:8080", //"https://backend-dev.cloud.arol.com:443"
});

const AxiosInterceptor = ({ children }) => {
  const navigate = useNavigate();

  const { dispatchPrincipal } = useContext(PrincipalContext);
  const toast = useContext(ToastContext);

  useEffect(() => {
    const requestInterceptor = async (request: AxiosRequestConfig) => {
      const authToken = localStorage.getItem("authToken");

      if (authToken) {
        request.headers!!["Authorization"] = "Bearer " + authToken;
      }

      return request;
    };

    const responseInterceptor = async (response: AxiosResponse) => {
      return response;
    };

    const errorInterceptor = async (error: any) => {
      const originalConfig = error.config;

      console.log("INTERCEPTOR ERROR", error);

      //REQUEST IS NOT ON /public ENDPOINT and CODE IS 401 (unauthorized)
      if (!originalConfig.url.startsWith("/public") && error.response.status === 401) {
        //If token refresh call already failed, don't retry - no logout since already logged out on call failed
        let refreshFailed = localStorage.getItem("refreshFailed");
        if (refreshFailed) {
          return Promise.reject();
        }

        //If not retrying with new token,
        if (!originalConfig._retry) {
          let isRefreshing = localStorage.getItem("isRefreshing");

          if (!isRefreshing) {
            originalConfig._retry = true;

            try {
              let refreshTokenResponse;

              let principalID = localStorage.getItem("id");
              let refreshToken = localStorage.getItem("refreshToken");

              if (principalID && refreshToken) {
                //Set isRefreshing LOCK
                localStorage.setItem("isRefreshing", "true");

                refreshTokenResponse = await authService.refreshToken(parseInt(principalID), refreshToken);

                console.log("INTERCEPTOR: TOKEN refreshed");
              } else {
                console.error("Refresh token not found on Localstorage");
                //Throw in order to logout if REFRESH TOKEN or ID not found on localstorage
                // eslint-disable-next-line no-throw-literal
                throw null;
              }

              localStorage.setItem("principal", JSON.stringify(refreshTokenResponse));
              localStorage.setItem("authToken", refreshTokenResponse.authToken);
              localStorage.setItem("id", refreshTokenResponse.id);
              localStorage.setItem("refreshToken", refreshTokenResponse.refreshToken);

              //Clear isRefreshing LOCK
              localStorage.removeItem("isRefreshing");

              dispatchPrincipal({
                principal: refreshTokenResponse,
                type: "set-principal",
              });
            } catch (e: any) {
              localStorage.setItem("refreshFailed", "true");

              console.log("EXCEPTION INTERCEPTOR", e);
              dispatchPrincipal({
                type: "logout",
                principal: null,
              });
              navigate("/login");

              toast({
                title: "Session expired. Please log in again.",
                variant: "left-accent",
                status: "error",
                position: "top-right",
                isClosable: true,
              });

              return Promise.reject(error);
            }

            return instance(originalConfig);
          }
          //TOKEN IS BEING REFRESHED - resend request with retry FALSE
          else {
            return instance(originalConfig);
          }
        }
        //RETRY TRUE but REFRESH NOT FAILED - retry
        else if (!refreshFailed) {
          return instance(originalConfig);
        }
        //RETRY TRUE - refresh failed so reject request and do not retry
        else {
          return Promise.reject(error);
        }
      }

      return Promise.reject(error);
    };

    let axiosRequestInterceptor, axiosResponseInterceptor;

    axiosRequestInterceptor = instance.interceptors.request.use(requestInterceptor);

    axiosResponseInterceptor = instance.interceptors.response.use(responseInterceptor, errorInterceptor);

    return () => {
      instance.interceptors.response.eject(axiosResponseInterceptor);
      instance.interceptors.request.eject(axiosRequestInterceptor);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return children;
};

export default instance;
export { AxiosInterceptor };
