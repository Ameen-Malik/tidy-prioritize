import { useState } from "react";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Home } from "lucide-react";
import { TaskList } from "@/components/tasks/TaskList";
import { format } from "date-fns";

const Calendar = () => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      <div className="container mx-auto px-4 py-4 sm:py-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 sm:mb-8">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">Calendar View</h1>
            <p className="text-sm sm:text-base text-gray-600 mt-1 sm:mt-2">
              View and manage tasks by date
            </p>
          </div>
          <Link to="/">
            <Button variant="outline">
              <Home className="mr-2 h-4 w-4" />
              Home
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-8">
          <div className="bg-white rounded-lg shadow-sm p-6 flex justify-center">
            <CalendarComponent
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              className="rounded-md border pointer-events-auto"
            />
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-4">
              {selectedDate ? `Tasks for ${format(selectedDate, "MMMM d, yyyy")}` : "Select a date"}
            </h2>
            {selectedDate && <TaskList refresh={refreshKey} date={selectedDate} />}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Calendar;
