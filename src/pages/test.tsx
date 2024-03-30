import { columns } from "@/components/table/columns";
import { DataTable } from "@/components/table/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import useData from "@/hooks/useData";

export default function TaskPage() {
  const { records, progress, count, getCount, getData, getAbstracts } =
    useData();

  async function handleSearch(lookFor: string) {
    await getData({ lookFor });
  }

  return (
    <div className="hidden h-full flex-1 flex-col space-y-8 p-8 md:flex">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            Buscador Científico
          </h2>
          <p className="text-muted-foreground">Buscador brabrabrabra</p>
        </div>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          // @ts-ignore
          handleSearch(e.target.elements.search.value);
        }}
        className="flex w-full max-w-sm items-center space-x-2"
      >
        <Input type="search" id="search" placeholder="Search" />
        <Button type="submit">Buscar</Button>
      </form>

      {records && <DataTable data={records} columns={columns} />}
    </div>
  );
}
