import PageHeader from "@/components/features/page-header";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { toast } from "react-toastify";

const initialData = {
  accountName: "",
  accountNo: "",
  accountType: "BANK_ACCOUNT",
};

const AffiliateComponent = ({ discount, balance }) => {
  const [data, setData] = useState(initialData);
  const [copyClicked, setCopyClicked] = useState(false);
  const [loading, setLoading] = useState(false);

  const router = useRouter()
  const { data: session, update } = useSession();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setData({ ...data, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!data.accountName || !data.accountNo) return toast.error("All fields are required");

    setLoading(true);
    try {
      const res = await fetch("/api/withdraw", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          data,
          session,
          balance
        }),
      });

      const resData = await res.json();
      if (resData.statusCode !== 200) {
        return toast.error(resData.message || "Failed to withdraw. Try again");
      }

      update()
      toast.success("Withdrawal successful. Check email");
      router.refresh()
    } catch (err) {
      console.log(err);
      toast.error("Failed to withdraw. Try again");
    } finally {
      setLoading(false);
    }
  };

  const copyCode = () => {
    navigator.clipboard.writeText(discount?.code);
    setCopyClicked(true);

    setTimeout(() => {
      setCopyClicked(false);
    }, 1500);
  };

  return (
    <div className="main pb-24">
      <PageHeader title="Affiliate Marketing" subTitle="" />
      <div className="w-full flex flex-col items-center pt-5">
        <div className="w-[90%] max-w-6xl justify-between flex flex-col md:flex-row gap-10 md:gap-0 form-group">
          <label className="w-[200px] md:w-[250px] !mb-0">
            Available Amount
            <input type="text" value={`Rp   ${balance || 0}`} disabled className="form-control" />
          </label>
          <div className="flex items-end">
            <label className="w-[200px] md:w-[250px] !mb-0">
              Affiliate Code
              <input type="text" value={discount?.code} disabled className="form-control" />
            </label>
            <button className="btn btn-white !border !border-black !min-w-[100px] !h-[41px] copy-button" onClick={copyCode}>
              {copyClicked ? "Copied" : "Copy"}
            </button>
          </div>
        </div>
        <br />
        <form className="flex flex-col items-center py-16 border w-[90%] max-w-screen-lg">
          <h2 className="py-2">Withdraw</h2>
          <label className="w-[250px]">
            Account Holder Name
            <input
              type="text"
              value={data.accountName}
              name="accountName"
              onChange={handleChange}
              disabled={balance === 0}
              className="form-control"
            />
          </label>
          <label className="w-[250px]">
            Account Number
            <input
              type="text"
              value={data.accountNo}
              name="accountNo"
              onChange={handleChange}
              disabled={balance === 0}
              className="form-control"
            />
          </label>
          {/* <label className="w-[250px]">
            Account Type
            <input
              type="text"
              value={data.accountType}
              name="accountType"
              onChange={handleChange}
              // disabled={balance === 0}
              disabled={true}
              className="form-control"
            />
          </label> */}
          <button
            className="btn btn-primary w-16"
            onClick={handleSubmit}
            disabled={balance === 0 || loading}
          >
            {loading ? 'Sending' : 'Withdraw'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AffiliateComponent;
