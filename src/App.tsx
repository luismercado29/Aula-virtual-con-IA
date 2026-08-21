import { GraduationCap, LogOut } from 'lucide-react';
import useStore from './store/useStore';
import CourseCard from './components/CourseCard';
import Recommendations from './components/Recommendations';

const USUARIO_DEMO_ID = '1';

function App() {
  const { courses, users, currentUser, setCurrentUser } = useStore();

  // Inicio de sesion simulado para la demostracion.
  //
  // Se recupera el usuario guardado en lugar de crear uno nuevo cada vez: antes
  // se construia un objeto con interacciones vacias, de modo que al cerrar y
  // volver a entrar se perdia todo el historial y las recomendaciones se
  // reiniciaban.
  const login = () => {
    const guardado = users.find((u) => u.id === USUARIO_DEMO_ID);
    setCurrentUser(
      guardado ?? {
        id: USUARIO_DEMO_ID,
        name: 'Luis Mercado',
        email: 'estudiante@aulavirtual.local',
        role: 'student',
        enrolledCourses: [],
        interactions: []
      }
    );
  };

  const inscritos = currentUser?.enrolledCourses.length ?? 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Encabezado */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <GraduationCap className="w-8 h-8 text-indigo-600" />
              <h1 className="text-xl font-bold text-gray-900">Aula Virtual</h1>
            </div>
            {!currentUser ? (
              <button
                onClick={login}
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition"
              >
                Iniciar sesión
              </button>
            ) : (
              <div className="flex items-center gap-4">
                <span className="text-gray-700 hidden sm:inline">
                  Bienvenido, {currentUser.name}
                </span>
                <span className="text-sm text-gray-500">
                  {inscritos} {inscritos === 1 ? 'curso inscrito' : 'cursos inscritos'}
                </span>
                <button
                  onClick={() => setCurrentUser(null)}
                  className="inline-flex items-center gap-1.5 text-gray-600 hover:text-gray-900"
                >
                  <LogOut className="w-4 h-4" />
                  Cerrar sesión
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Contenido */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentUser ? (
          <div className="space-y-12">
            <Recommendations />

            <div className="space-y-6">
              <h2 className="text-2xl font-bold">Todos los cursos</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {courses.map(course => (
                  <CourseCard key={course.id} course={course} />
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-gray-900">
              Bienvenido al Aula Virtual
            </h2>
            <p className="mt-4 text-gray-600">
              Inicia sesión para ver recomendaciones de cursos personalizadas.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
