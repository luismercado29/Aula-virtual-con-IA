import { Course } from '../types';
import { BookOpen, Clock, BarChart, Check, Plus } from 'lucide-react';
import useStore from '../store/useStore';

interface Props {
  course: Course;
}

const DIFICULTAD: Record<Course['difficulty'], string> = {
  beginner: 'Principiante',
  intermediate: 'Intermedio',
  advanced: 'Avanzado'
};

export const CourseCard: React.FC<Props> = ({ course }) => {
  const { currentUser, addInteraction, toggleEnrollment } = useStore();

  const inscrito = currentUser?.enrolledCourses.includes(course.id) ?? false;

  const handleClick = () => {
    if (!currentUser) return;

    addInteraction({
      courseId: course.id,
      timestamp: Date.now(),
      type: 'view'
    });
  };

  const handleInscripcion = (e: React.MouseEvent) => {
    // La tarjeta entera registra una visita al hacer clic; sin esto, pulsar el
    // boton dispararia tambien esa visita.
    e.stopPropagation();
    if (!currentUser) return;
    toggleEnrollment(course.id);
  };

  return (
    <div
      className="bg-white rounded-xl shadow-lg overflow-hidden transition-transform hover:scale-105 cursor-pointer flex flex-col"
      onClick={handleClick}
    >
      <div className="relative">
        <img
          src={course.thumbnail}
          alt={course.title}
          loading="lazy"
          className="w-full h-48 object-cover"
        />
        {inscrito && (
          <span className="absolute top-3 right-3 bg-emerald-600 text-white text-xs font-semibold px-2.5 py-1 rounded-full shadow">
            Inscrito
          </span>
        )}
      </div>

      <div className="p-6 flex flex-col flex-1">
        <h3 className="text-xl font-semibold mb-2">{course.title}</h3>
        <p className="text-gray-600 mb-4">{course.description}</p>

        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            <span>{course.duration} min</span>
          </div>
          <div className="flex items-center gap-1">
            <BarChart className="w-4 h-4" />
            <span>{DIFICULTAD[course.difficulty]}</span>
          </div>
          <div className="flex items-center gap-1">
            <BookOpen className="w-4 h-4" />
            <span>{course.instructor}</span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleInscripcion}
          aria-pressed={inscrito}
          className={`mt-5 w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition ${
            inscrito
              ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
              : 'bg-indigo-600 text-white hover:bg-indigo-700'
          }`}
        >
          {inscrito ? (
            <>
              <Check className="w-4 h-4" />
              Inscrito
            </>
          ) : (
            <>
              <Plus className="w-4 h-4" />
              Inscribirme
            </>
          )}
        </button>
      </div>
    </div>
  );
}

export default CourseCard;
