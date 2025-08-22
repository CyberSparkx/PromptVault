import { useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";

const NAV_ITEMS = [
	{ to: "/", icon: "ri-quill-pen-ai-fill", label: "Add Prompt" },
	{
		to: "/dashboard",
		icon: "ri-dashboard-horizontal-fill",
		label: "Dashboard",
	},
	{ to: "/community", icon: "ri-compass-3-fill", label: "Community" },
	{ to: "/profile", icon: "ri-user-fill", label: "Profile" },
];

const STORAGE_KEY = "pv:isNavOpen";

export default function Navbar() {
	const location = useLocation();

	const HIDE_ON_PATHS = ["/login", "/signup"];
	const shouldHide = HIDE_ON_PATHS.some((p) => location.pathname.startsWith(p));

	if (shouldHide) return null;
	const [isOpen, setIsOpen] = useState<boolean>(() => {
		try {
			const saved = localStorage.getItem(STORAGE_KEY);
			return saved ? JSON.parse(saved) : true;
		} catch {
			return true;
		}
	});

	useEffect(() => {
		try {
			localStorage.setItem(STORAGE_KEY, JSON.stringify(isOpen));
		} catch {}
	}, [isOpen]);

	const toggle = () => setIsOpen((o) => !o);

	return (
		<nav
			className={`flex min-h-screen flex-col border-gray-3 border-r bg-gray-2 text-neutral-800 shadow-sm transition-[width] duration-300 ease-in-out ${
				isOpen ? "w-64" : "w-20"
			}`}
			aria-label="Primary sidebar"
		>
			<div className="flex h-20 items-center gap-2 overflow-hidden">
				<div
					className={[
						"flex items-center rounded-r-full bg-black-1 text-white-1 shadow-sm",
						"overflow-hidden transition-all duration-300 ease-in-out",
						isOpen
							? "max-w-[260px] translate-x-0 py-2 pr-4 pl-4 opacity-100"
							: "-translate-x-8 max-w-0 py-2 pr-0 pl-0 opacity-0",
					].join(" ")}
				>
					<img
						src="/logo.svg"
						alt="Prompt Vault Logo"
						className="h-9 w-9 shrink-0 select-none transition-transform duration-300 ease-in-out"
						draggable={false}
					/>
					<span
						className={`ml-2 select-none whitespace-nowrap font-semibold text-[1.3rem] tracking-tight transition-all duration-300 ease-in-out ${
							isOpen ? "translate-x-0 opacity-100" : "translate-x-4 opacity-0"
						}`}
					>
						Prompt Vault
					</span>
				</div>

				<button
					onClick={toggle}
					aria-label={isOpen ? "Collapse sidebar" : "Expand sidebar"}
					aria-expanded={isOpen}
					type="button"
					className="flex flex-1 cursor-pointer items-center justify-center rounded-l-full bg-black-1 py-2 text-white-1 shadow-sm outline-none transition-all duration-300 ease-in-out"
				>
					<svg
						className={`h-9 w-9 transition-transform duration-300 ease-in-out ${
							isOpen ? "" : "rotate-180"
						}`}
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						strokeWidth={2}
						strokeLinecap="round"
						strokeLinejoin="round"
						aria-hidden="true"
					>
						<path d="M15 18L9 12L15 6" />
					</svg>
				</button>
			</div>

			<div
				className={`mx-4 mb-2 h-px bg-gradient-to-r from-transparent via-gray-600 to-transparent transition-all duration-300 ease-in-out ${
					isOpen ? "scale-x-100 opacity-100" : "scale-x-0 opacity-0"
				}`}
			/>

			<ul className="mt-1 flex flex-col gap-1 px-2">
				{NAV_ITEMS.map((item, index) => (
					<li key={item.to}>
						<NavLink
							to={item.to}
							end={item.to === "/"}
							className={({ isActive }) =>
								[
									"group relative flex h-12 w-full items-center rounded-xl font-medium transition-all delay-75 duration-200 ease-in-out",
									isActive
										? "transform bg-black-1 text-white-1 shadow-sm"
										: "text-black-1 hover:scale-[1.01] hover:bg-neutral-200/70 hover:text-neutral-900",
									isOpen ? "pr-3 pl-2" : "px-0",
								].join(" ")
							}
							style={{
								transitionDelay: `${index * 50}ms`, // Staggered animation
							}}
						>
							<div
								className={[
									"flex h-12 w-12 items-center justify-center transition-all duration-200 ease-in-out",
									isOpen ? "" : "mx-auto",
								].join(" ")}
							>
								<i
									className={`${item.icon} text-[1.35rem] transition-transform duration-200 ease-in-out`}
								/>
							</div>

							<div
								className={[
									"overflow-hidden transition-all duration-200 ease-in-out",
									isOpen
										? "ml-2 w-full translate-x-0 opacity-100"
										: "-translate-x-2 w-0 opacity-0",
								].join(" ")}
							>
								<span className="block whitespace-nowrap">{item.label}</span>
							</div>

							{!isOpen && (
								<span
									className="-translate-y-1/2 pointer-events-none absolute top-1/2 left-full z-50 ml-3 transform rounded-lg bg-black-1 px-3 py-2 font-medium text-sm text-white-1 opacity-0 shadow-lg transition-all duration-300 ease-in-out group-hover:translate-x-1 group-hover:opacity-100"
									role="tooltip"
								>
									{item.label}
									<span className="-translate-y-1/2 absolute top-1/2 right-full transform border-4 border-transparent border-r-black-1" />
								</span>
							)}
						</NavLink>
					</li>
				))}
			</ul>

			<div
				className={`mt-auto mb-4 flex flex-col items-center text-[0.7rem] text-gray-4 transition-all duration-500 ease-in-out ${
					isOpen
						? "translate-y-0 scale-100 opacity-100"
						: "pointer-events-none translate-y-4 scale-95 opacity-0"
				}`}
				style={{
					transitionDelay: isOpen ? "400ms" : "0ms",
				}}
			>
				<span className="transition-all duration-300 hover:text-gray-5">
					v1.0.0
				</span>
				<span className="mt-1 transition-all duration-300 hover:text-gray-5">
					Made with ❤
				</span>
			</div>
		</nav>
	);
}
