"use client";
import { Tabs, TabList, Tab, TabPanel } from "react-tabs";
import SignInComponent from "./sign-in";
import Link from "next/link";

const LoginForm = () => {
  return (
    <div className="login-container">
      <Tabs selectedTabClassName="show" defaultIndex={0}>
        <TabList className="nav nav-pills nav-fill">
          <Tab className="nav-item">
            <span className="nav-link">Personal</span>
          </Tab>
          <Tab className="nav-item">
            <span className="nav-link">Bisnis</span>
          </Tab>
        </TabList>
        <div className="tab-content">
          <TabPanel style={{ paddingTop: "2rem" }}>
            <SignInComponent type="user" />
          </TabPanel>
          <TabPanel>
            <SignInComponent type="business" />
          </TabPanel>
        </div>
      </Tabs>

      <div className="signup-option text-center mt-4">
        <p>Belum punya akun? <Link href="/auth/daftar" className="signup-link">Daftar</Link></p>
      </div>
    </div>
  );
};

export default LoginForm;