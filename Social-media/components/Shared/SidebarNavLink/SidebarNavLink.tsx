import { GoHome } from "react-icons/go";
import { BsExclamationCircle } from "react-icons/bs";
import { FaRegQuestionCircle } from "react-icons/fa";
import { FiHeadphones, FiUsers, FiShield, FiX } from "react-icons/fi";
import FriendsIcon from "../../Icons/FriendsIcon";
import StoreIcon from "../../Icons/StoreIcon";
import SubscriptionIcon from "../../Icons/SubscriptionIcon";
import Link from "next/link";
import HexagonIcon from "../../Icons/HexagonIcon";
import { FiPlus, FiTag } from "react-icons/fi";
import { useRouter } from "next/navigation";
import bg from "../../../public/main-bg.jpg";

interface SidebarNavLinkProps {
  isSidebarOpen?: boolean;
  onClose?: () => void;
  className?: string;
  showMobileHeader?: boolean;
  navClassName?: string;
}
const menuItems = [
  {
    icon: <GoHome size={24} />,
    label: "Home",
    href: "/",
  },
  {
    icon: <FriendsIcon />,
    label: "Friends",
    href: "/main/friends",
  },
  // {
  //   icon: <IoTrendingUp size={24} />,
  //   label: "Popular",
  //   href: "/popular",
  // },
  {
    icon: <StoreIcon />,
    label: "Virtual Store",
    href: "/marketplace",
  },
  {
    icon: <SubscriptionIcon />,
    label: "Subscription",
    href: "/main/subscription",
  },
];
const menuItemsTwo = [
  {
    icon: <FaRegQuestionCircle size={24} />,
    label: "Help",
    href: "/help",
  },
  {
    icon: <FiHeadphones size={24} />,
    label: "Support",
    href: "/help-support",
  },
  {
    icon: <BsExclamationCircle size={24} className="scale-y-[-1]" />,
    label: "Contact Us",
    href: "/contact-us",
  },
  {
    icon: <FiUsers size={24} />,
    label: "About Us",
    href: "/about-us",
  },
  {
    icon: <FiShield size={24} />,
    label: "Privacy",
    href: "/privacy",
  },
];

const SidebarNavLinkContent = ({ className = "" }: { className?: string }) => {
  const router = useRouter();

  const safeHref = (href: string) => (href.startsWith("/") ? href : `/${href}`);
  return (
    <nav className={`space-y-3 text-gray-700 mt-24 ${className}`}>
      <div className="bg-[#06133FBF] backdrop-blur-[1px] py-6 px-2 rounded-2xl">
        {menuItems.map((item) => (
          <Link
            key={item.label}
            href={safeHref(item.href)}
            className="text-xs text-white flex items-center gap-5 hover:bg-[#06133FBF] p-2.5 px-6 rounded-xl duration-300 ease-in-out"
          >
            {item.icon} {item.label}
          </Link>
        ))}
      </div>
      <div className="bg-[#06133FBF] backdrop-blur-[1px] py-3 px-2.5 rounded-2xl">
        <h3 className="text-base text-[#BCB3B3] px-8 my-4">Communities</h3>
        <Link
          href="/main/communities"
          className="w-full text-xs text-white flex items-center gap-5 hover:bg-[#06133FBF] p-2.5 px-6 rounded-xl duration-300 ease-in-out"
        >
          <FriendsIcon /> Communities
        </Link>
        <button onClick={() => router.push('/main/create-community')} className="w-full text-xs text-white flex items-center gap-5 hover:bg-[#06133FBF] p-2.5 px-6 rounded-xl duration-300 ease-in-out cursor-pointer">
          <FiPlus size={24} /> Create Communities
        </button>
        <button
          onClick={() => router.push('/main/manage-communities')}
          className="w-full text-xs text-white flex items-center gap-5 hover:bg-[#06133FBF] p-2.5 px-6 rounded-xl duration-300 ease-in-out cursor-pointer"
        >
          <HexagonIcon /> Manage Communities
        </button>
      </div>
      <div className="bg-[#06133FBF] backdrop-blur-[1px] py-3 px-2.5 rounded-2xl">
        <h3 className="text-base text-[#BCB3B3] px-8 my-4">Categories</h3>
        <button
          onClick={() => router.push('/main/join-categories')}
          className="w-full text-xs text-white flex items-center gap-5 hover:bg-[#06133FBF] p-2.5 px-6 rounded-xl duration-300 ease-in-out cursor-pointer"
        >
          <FiPlus size={24} /> Join Categories
        </button>
        <button
          onClick={() => router.push('/main/categories')}
          className="w-full text-xs text-white flex items-center gap-5 hover:bg-[#06133FBF] p-2.5 px-6 rounded-xl duration-300 ease-in-out cursor-pointer"
        >
          <FiTag size={24} /> Manage Categories
        </button>
      </div>
      <div className="bg-[#06133FBF] backdrop-blur-[1px] py-6 px-2.5 rounded-2xl">
        {menuItemsTwo.map((item) => (
          <Link
            key={item.label}
            href={safeHref(item.href)}
            className="text-xs text-white flex items-center gap-5 hover:bg-[#06133FBF] p-2.5 px-6 rounded-xl duration-300 ease-in-out"
          >
            {item.icon} {item.label}
          </Link>
        ))}
      </div>
    </nav>
  );
};

const SidebarNavLink = ({
  isSidebarOpen,
  onClose,
  className = "",
  showMobileHeader = true,
  navClassName = "",
}: SidebarNavLinkProps) => {
  const baseClasses = "fixed left-0 h-[100vh] bg-cover bg-center bg-no-repeat shadow-md transform transition-transform duration-300 xl:translate-x-0 z-50 lg:z-30 w-[370px] p-10 hover:overflow-y-auto overflow-y-hidden custom-scroll";
  const mobileClasses = isSidebarOpen ? "translate-x-0" : "-translate-x-full";

  const asideClasses = `${baseClasses} ${mobileClasses} ${className}`;

  return (
    <aside
      style={{
        backgroundImage: `url(${bg.src})`,
        scrollbarGutter: "stable both-edges",
      }}
      className={asideClasses}
      onClick={(e) => e.stopPropagation()}
    >
      {showMobileHeader && (
        <div className="flex justify-between items-center mb-4 xl:hidden">
          <h2 className="font-semibold text-lg text-white">Menu</h2>
          {onClose && (
            <button onClick={onClose}>
              <FiX size={24} className="text-white cursor-pointer" />
            </button>
          )}
        </div>
      )}
      <SidebarNavLinkContent className={navClassName} />
    </aside>
  );
};

export default SidebarNavLink;
