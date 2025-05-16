"use client";

import { useState } from "react";
import { Tabs, TabList, Tab, TabPanel } from "react-tabs";

import IndividualSignUpComponent from "./individual-sign-up";
import BusinessOnlineSignUpComponent from "./b-online-sign-up";
import BusinessWholesaleSignUpComponent from "./b-wholesale-sign-up";

const RegisterForm = () => {
  const [step, setStep] = useState(0);

  return (
    <>
      {step === 0 ? (
        <div className="w-full">
          <h3 className="">Bersiaplah berkelana rasa bersama mrkt. Indonesia</h3>
          <p>Tujuan Anda menggunakan produk mrkt.?</p>
          <div className="flex flex-col gap-5 mt-4">
            <button
              onClick={() => setStep(1)}
              className="w-full h-24 cursor-pointer hover:bg-slate-400 transition-all duration-100 bg-slate-300 border-[1px] border-solid !border-black text-black font-medium text-2xl rounded-2xl"
            >
              Penggunaan personal/individu
            </button>
            <button
              onClick={() => setStep(2)}
              className="w-full h-24 cursor-pointer hover:bg-slate-400 transition-all duration-100 bg-slate-300 border-[1px] border-solid !border-black text-black font-medium text-2xl rounded-2xl"
            >
              Tujuan bisnis/komersial
            </button>
          </div>
        </div>
      ) : (
        <>
          <span className="icon-arrow-left absolute top-10 left-10 text-5xl cursor-pointer" onClick={() => setStep(0)}></span>
          {step === 1 && <IndividualSignUpComponent />}
          {step === 2 && (
            <>
              <h3 className="text-center py-2">Registrasi untuk bisnis</h3>

              <Tabs selectedTabClassName="show" defaultIndex={0}>
                <TabList className="nav nav-pills nav-fill">
                  <Tab className="nav-item">
                    <span className="nav-link">Toko online</span>
                  </Tab>

                  <Tab className="nav-item">
                    <span className="nav-link">Pedagang grosir</span>
                  </Tab>
                </TabList>

                <div className="tab-content">
                  <TabPanel style={{ paddingTop: "2rem" }}>
                    <BusinessOnlineSignUpComponent type="online" />
                  </TabPanel>

                  <TabPanel>
                    <BusinessWholesaleSignUpComponent type="wholesale" />
                  </TabPanel>
                </div>
              </Tabs>
            </>
          )}
        </>
      )}
    </>
  );
};

export default RegisterForm;
