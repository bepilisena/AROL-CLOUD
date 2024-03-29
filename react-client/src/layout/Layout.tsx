import { Box, useDisclosure } from "@chakra-ui/react";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import Router from "../router/Router";
import { useContext, useMemo } from "react";
import PrincipalContext from "../utils/contexts/PrincipalContext";
import SidebarStatusContext from "../utils/contexts/SidebarStatusContext";

export default function Layout() {
  const { principal } = useContext(PrincipalContext);
  const { sidebarStatus } = useContext(SidebarStatusContext);

  const { isOpen, onOpen, onClose } = useDisclosure();

  const marginLeft = useMemo(() => {
    if (!principal || principal.isTemp) return "0px";

    if (sidebarStatus.status === "open") return "279px";

    return "65px";
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [principal !== null, sidebarStatus.status]);

  const displaySidebar = useMemo(() => {
    return principal && sidebarStatus.type !== "none" && !principal.isTemp;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [principal !== null, sidebarStatus.type]);

  return (
    <Box minH="100vh" bg={"gray.200"}>
      {displaySidebar && <Sidebar isOpen={isOpen} onOpen={onOpen} onClose={onClose} />}
      <Navbar />
      <Box ml={{ base: 0, md: marginLeft }} p="4">
        <Router />
      </Box>
    </Box>
  );
}
