import Header from "@/components/Header";
import ControlPanel from "@/components/ControlPanel";
import ListTitle from "@/components/ListTitle";
import TaskList from "@/components/TaskList";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col bg-[url('/default-img.jpg')] bg-cover bg-center text-slate-950">
      <Header />

      <section className="flex flex-1 items-start justify-center px-4 py-8">
        <div className="w-full max-w-3xl rounded-3xl bg-white/85 p-5 shadow-xl backdrop-blur-md md:p-8">
          <ListTitle />
          <ControlPanel />
          <TaskList />
        </div>
      </section>

      <Footer />
    </main>
  );
}