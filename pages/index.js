import Link from "next/link";


export default function Home() {
	return (
		<>
			<p>
				Get started by getting a list of contexts from <Link href="/nui/context">here</Link>
			</p>
			<p>
				Or look to do PI Planning <Link href="/nui/planning">here</Link>
			</p>
		</>
	)
}
