import { FaUser, FaMoon, FaSun } from "react-icons/fa";

const Navbar = () => {
  return (
    <div className="flex justify-between px-6 py-4 shadow-md">
      <div className="font-semibold text-xl">InsightSphere</div>
      <div className="flex flex-row gap-5 justify-center">
        <FaUser className="text-xl hover:cursor-pointer" />
        <FaSun className="text-xl hover:cursor-pointer hover:text-yellow-300" />
      </div>
    </div>
  );
};

export default Navbar;
