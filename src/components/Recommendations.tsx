import { Sparkles } from 'lucide-react';
import useStore from '../store/useStore';
import { CourseCard } from './CourseCard';

const Recommendations: React.FC = () => {
  const { recommendations, currentUser } = useStore();

  if (!currentUser?.interactions.length) {
    return (
      <div className="bg-white rounded-lg p-6 shadow-sm">
        <h2 className="text-2xl font-bold mb-4">Para empezar</h2>
        <p className="text-gray-600">
          Haz clic en los cursos que te interesen o inscríbete en alguno: con eso
          se arman tus recomendaciones personalizadas.
        </p>
      </div>
    );
  }

  if (!recommendations.length) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Sparkles className="w-6 h-6 text-indigo-600" />
        <h2 className="text-2xl font-bold">Recomendado para ti</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {recommendations.map(course => (
          <CourseCard key={course.id} course={course} />
        ))}
      </div>
    </div>
  );
}

export default Recommendations;
