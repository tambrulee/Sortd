type ListTitleProps = {
  listName: string;
  onChangeListName: (value: string) => void;
};

export default function ListTitle({
  listName,
  onChangeListName,
}: ListTitleProps) {
  return (
    <div className="mb-6 flex gap-2">
      <input
        value={listName}
        onChange={(e) => onChangeListName(e.target.value)}
        className="w-full rounded-2xl bg-[#eeeaea] px-4 py-3 text-lg font-semibold outline-none focus:ring-2 focus:ring-[#cd6ce7]"
        placeholder="Name your list..."
      />
    </div>
  );
}
