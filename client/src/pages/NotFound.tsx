import { Link } from "react-router-dom";

export default function NotFound() {
	return (
		<section className="flex h-dvh flex-1 bg-white-2">
			<div className="mx-auto flex w-11/12 max-w-xl flex-1 items-center justify-center">
				<div className="w-full rounded-md border border-gray-2 bg-gray-1 p-6 text-center">
					<h1 className="font-medium text-2xl">Page not found</h1>
					<Link
						to="/"
						className="mt-4 inline-flex items-center rounded-md bg-black-1 px-4 py-2 font-medium text-white text-xs shadow-sm transition-colors hover:bg-black"
					>
						<i className="ri-home-3-line mr-1" />
						Home
					</Link>
				</div>
			</div>
		</section>
	);
}
