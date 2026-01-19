import { FiSidebar, FiSettings } from "react-icons/fi";
import { RiEdit2Line } from "react-icons/ri";
import { FaSearch } from "react-icons/fa";
const SidePanel = () => {
  return (
    <div className="flex flex-col pb-4 justify-between border-r border-r-black">
      <div className="flex flex-col gap-y-3 pl-2 py-6">
        <FiSidebar className="text-xl" />
        <div className="py-4 flex flex-col gap-2">
          <FaSearch className="text-xl" />
          <RiEdit2Line className="text-xl" />
        </div>
      </div>
      <div className="pl-2 py-6">
        <FiSettings className="text-xl" />
      </div>
    </div>
  );
};

export default SidePanel;
