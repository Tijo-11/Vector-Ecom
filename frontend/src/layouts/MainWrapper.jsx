// MainWrapper.jsx
import { useEffect, useState } from "react";
import { setUser } from "../utils/auth";

const MainWrapper = ({ children }) => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const handler = async () => {
      console.log("MainWrapper: Starting auth check...");
      setLoading(true);

      try {
        await setUser();
        console.log("MainWrapper: Auth completed successfully");
      } catch (error) {
        console.error("MainWrapper: Auth error:", error);
      } finally {
        setLoading(false);
        console.log("MainWrapper: Loading set to false");
      }
    };

    handler();
  }, []);

  return <>{loading ? null : children}</>;
};

export default MainWrapper;
