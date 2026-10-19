import { domains } from "@/lib/data";
import { questionsByDomain } from "@/lib/questions";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { QzBadge } from "@/components/quizland/qz-badge";
import { AdminUsersTab } from "@/components/quizland/admin-users-tab";

export const metadata = {
  title: "Administration — Quizland",
};

const allQuestions = Object.values(questionsByDomain).flat();

export default function AdminPage() {
  return (
    <div className="mx-auto max-w-5xl px-5 py-10 sm:px-8 sm:py-14">
      <h1 className="mb-8 font-heading text-2xl font-extrabold text-[#7B2FE3] sm:text-[26px]">
        Administration
      </h1>

      <Tabs defaultValue="questions">
        <TabsList className="mb-6 bg-[#F6EEFF]">
          <TabsTrigger
            value="questions"
            className="text-[#6B7094] data-active:bg-[#7B2FE3] data-active:text-white"
          >
            Questions
          </TabsTrigger>
          <TabsTrigger
            value="domaines"
            className="text-[#6B7094] data-active:bg-[#7B2FE3] data-active:text-white"
          >
            Domaines
          </TabsTrigger>
          <TabsTrigger
            value="utilisateurs"
            className="text-[#6B7094] data-active:bg-[#7B2FE3] data-active:text-white"
          >
            Utilisateurs
          </TabsTrigger>
        </TabsList>

        <TabsContent value="questions">
          <div className="rounded-2xl border-2 border-[#F0E3FF]">
            <Table>
              <TableHeader>
                <TableRow className="border-[#F0E3FF]">
                  <TableHead>Question</TableHead>
                  <TableHead>Domaine</TableHead>
                  <TableHead>Thème</TableHead>
                  <TableHead>Statut</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allQuestions.map((q) => {
                  const domain = domains.find((d) => d.slug === q.domain);
                  return (
                    <TableRow key={q.id} className="border-[#F6EEFF]">
                      <TableCell className="max-w-xs truncate font-medium text-[#1A0E33]">
                        {q.prompt}
                      </TableCell>
                      <TableCell className="text-[#6B7094]">
                        {domain?.icon} {domain?.name}
                      </TableCell>
                      <TableCell className="text-[#6B7094]">
                        {q.theme}
                      </TableCell>
                      <TableCell>
                        <QzBadge tone="teal">Actif</QzBadge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="domaines">
          <div className="rounded-2xl border-2 border-[#F0E3FF]">
            <Table>
              <TableHeader>
                <TableRow className="border-[#F0E3FF]">
                  <TableHead>Domaine</TableHead>
                  <TableHead>Questions</TableHead>
                  <TableHead>Difficulté</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {domains.map((d) => (
                  <TableRow key={d.slug} className="border-[#F6EEFF]">
                    <TableCell className="font-medium text-[#1A0E33]">
                      {d.icon} {d.name}
                    </TableCell>
                    <TableCell className="text-[#6B7094]">
                      {d.questions}
                    </TableCell>
                    <TableCell>
                      <QzBadge tone="primary">{d.difficulty}</QzBadge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="utilisateurs">
          <AdminUsersTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
