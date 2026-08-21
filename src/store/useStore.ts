import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { User, Course, CourseInteraction } from '../types';

interface State {
  currentUser: User | null;
  users: User[];
  courses: Course[];
  recommendations: Course[];
  setCurrentUser: (user: User | null) => void;
  addCourse: (course: Course) => void;
  addInteraction: (interaction: CourseInteraction) => void;
  toggleEnrollment: (courseId: string) => void;
  updateRecommendations: () => void;
}

const initialUsers: User[] = [
  {
    id: '1',
    name: 'Luis Mercado',
    email: 'luismer33@example.com',
    role: 'student',
    enrolledCourses: [],
    interactions: []
  },
  {
    id: '2',
    name: 'Jane Smith',
    email: 'jane@example.com',
    role: 'student',
    enrolledCourses: ['2'],
    interactions: [
      { courseId: '2', timestamp: Date.now() - 3000, type: 'view' },
      { courseId: '2', timestamp: Date.now() - 4000, type: 'enroll' }
    ]
  }
];

const initialCourses: Course[] = [
  {
    id: '1',
    title: 'Machine Learning Fundamentals',
    description: 'Learn the basics of machine learning and AI',
    instructor: 'Dr. Smith',
    category: 'Technology',
    tags: ['AI', 'ML', 'Data Science'],
    thumbnail: 'https://images.unsplash.com/photo-1555949963-aa79dcee981c?auto=format&fit=crop&q=80&w=1000',
    duration: 120,
    difficulty: 'beginner'
  },
  {
    id: '2',
    title: 'Web Development Bootcamp',
    description: 'Complete guide to modern web development',
    instructor: 'Jane Doe',
    category: 'Programming',
    tags: ['HTML', 'CSS', 'JavaScript'],
    thumbnail: 'https://images.unsplash.com/photo-1627398242454-45a1465c2479?auto=format&fit=crop&q=80&w=1000',
    duration: 180,
    difficulty: 'intermediate'
  },
  {
    id: '3',
    title: 'Data Science Essentials',
    description: 'Master the fundamentals of data science',
    instructor: 'Dr. Anderson',
    category: 'Technology',
    tags: ['Python', 'Statistics', 'Data Analysis'],
    thumbnail: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=1000',
    duration: 150,
    difficulty: 'intermediate'
  },
  {
    id: '4',
    title: 'Advanced JavaScript Patterns',
    description: 'Master advanced JavaScript design patterns and concepts',
    instructor: 'Sarah Johnson',
    category: 'Programming',
    tags: ['JavaScript', 'Design Patterns', 'Advanced'],
    thumbnail: 'https://images.unsplash.com/photo-1579468118864-1b9ea3c0db4a?auto=format&fit=crop&q=80&w=1000',
    duration: 240,
    difficulty: 'advanced'
  },
  {
    id: '5',
    title: 'UX/UI Design Principles',
    description: 'Create beautiful and user-friendly interfaces',
    instructor: 'Mike Wilson',
    category: 'Design',
    tags: ['UX', 'UI', 'Design'],
    thumbnail: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?auto=format&fit=crop&q=80&w=1000',
    duration: 160,
    difficulty: 'beginner'
  },
  {
    id: '6',
    title: 'Mobile App Development with React Native',
    description: 'Build cross-platform mobile apps',
    instructor: 'Emily Chen',
    category: 'Programming',
    tags: ['React Native', 'Mobile', 'JavaScript'],
    thumbnail: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?auto=format&fit=crop&q=80&w=1000',
    duration: 200,
    difficulty: 'intermediate'
  },
  {
    id: '7',
    title: 'Cloud Computing Fundamentals',
    description: 'Introduction to cloud services and architecture',
    instructor: 'David Clark',
    category: 'Technology',
    tags: ['Cloud', 'AWS', 'Azure'],
    thumbnail: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&q=80&w=1000',
    duration: 180,
    difficulty: 'beginner'
  },
  {
    id: '8',
    title: 'Cybersecurity Basics',
    description: 'Learn essential cybersecurity concepts',
    instructor: 'Robert Martinez',
    category: 'Security',
    tags: ['Security', 'Network', 'Privacy'],
    thumbnail: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=1000',
    duration: 160,
    difficulty: 'beginner'
  },
  {
    id: '9',
    title: 'Digital Marketing Strategy',
    description: 'Create effective digital marketing campaigns',
    instructor: 'Lisa Thompson',
    category: 'Marketing',
    tags: ['Marketing', 'Social Media', 'SEO'],
    thumbnail: 'https://images.unsplash.com/photo-1432888498266-38ffec3eaf0a?auto=format&fit=crop&q=80&w=1000',
    duration: 140,
    difficulty: 'intermediate'
  },
  {
    id: '10',
    title: 'Python for Data Analysis',
    description: 'Data analysis using Python and pandas',
    instructor: 'Dr. Anderson',
    category: 'Technology',
    tags: ['Python', 'Data Analysis', 'pandas'],
    thumbnail: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&q=80&w=1000',
    duration: 190,
    difficulty: 'intermediate'
  },
  {
    id: '11',
    title: 'Blockchain Technology',
    description: 'Understanding blockchain and cryptocurrencies',
    instructor: 'Alex Wong',
    category: 'Technology',
    tags: ['Blockchain', 'Crypto', 'Web3'],
    thumbnail: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?auto=format&fit=crop&q=80&w=1000',
    duration: 170,
    difficulty: 'advanced'
  },
  {
    id: '12',
    title: 'Game Development with Unity',
    description: 'Create 3D games using Unity engine',
    instructor: 'Chris Parker',
    category: 'Game Development',
    tags: ['Unity', 'C#', 'Games'],
    thumbnail: 'https://images.unsplash.com/photo-1556438064-2d7646166914?auto=format&fit=crop&q=80&w=1000',
    duration: 220,
    difficulty: 'intermediate'
  },
  {
    id: '13',
    title: 'DevOps Practices',
    description: 'Learn modern DevOps methodologies',
    instructor: 'Tom Wilson',
    category: 'Technology',
    tags: ['DevOps', 'CI/CD', 'Docker'],
    thumbnail: 'https://images.unsplash.com/photo-1618401471353-b98afee0b2eb?auto=format&fit=crop&q=80&w=1000',
    duration: 200,
    difficulty: 'advanced'
  },
  {
    id: '14',
    title: 'SQL Database Design',
    description: 'Master database design and SQL queries',
    instructor: 'Maria Garcia',
    category: 'Database',
    tags: ['SQL', 'Database', 'Design'],
    thumbnail: 'https://images.unsplash.com/photo-1544383835-bda2bc66a55d?auto=format&fit=crop&q=80&w=1000',
    duration: 160,
    difficulty: 'intermediate'
  },
  {
    id: '15',
    title: 'Content Creation Strategy',
    description: 'Create engaging content for digital platforms',
    instructor: 'Emma White',
    category: 'Marketing',
    tags: ['Content', 'Marketing', 'Social Media'],
    thumbnail: 'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&q=80&w=1000',
    duration: 130,
    difficulty: 'beginner'
  },
  {
    id: '16',
    title: 'Artificial Intelligence Ethics',
    description: 'Explore ethical considerations in AI development',
    instructor: 'Dr. Smith',
    category: 'Technology',
    tags: ['AI', 'Ethics', 'Technology'],
    thumbnail: 'https://images.unsplash.com/photo-1507146426996-ef05306b995a?auto=format&fit=crop&q=80&w=1000',
    duration: 150,
    difficulty: 'intermediate'
  },
  {
    id: '17',
    title: 'Vue.js Framework',
    description: 'Build modern web applications with Vue.js',
    instructor: 'Jane Doe',
    category: 'Programming',
    tags: ['Vue', 'JavaScript', 'Frontend'],
    thumbnail: 'https://images.unsplash.com/photo-1537884944318-390069bb8665?auto=format&fit=crop&q=80&w=1000',
    duration: 180,
    difficulty: 'intermediate'
  },
  {
    id: '18',
    title: 'Technical Writing',
    description: 'Write clear and effective technical documentation',
    instructor: 'Sarah Brown',
    category: 'Writing',
    tags: ['Documentation', 'Writing', 'Technical'],
    thumbnail: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&q=80&w=1000',
    duration: 120,
    difficulty: 'beginner'
  },
  {
    id: '19',
    title: 'IoT Development',
    description: 'Build Internet of Things applications',
    instructor: 'Michael Lee',
    category: 'Technology',
    tags: ['IoT', 'Hardware', 'Programming'],
    thumbnail: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=1000',
    duration: 210,
    difficulty: 'advanced'
  },
  {
    id: '20',
    title: 'Agile Project Management',
    description: 'Learn to manage projects using Agile methodology',
    instructor: 'Jennifer Scott',
    category: 'Management',
    tags: ['Agile', 'Scrum', 'Project Management'],
    thumbnail: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&q=80&w=1000',
    duration: 170,
    difficulty: 'intermediate'
  }
];

const useStore = create<State>()(
  persist(
    (set, get) => ({
  currentUser: null,
  users: initialUsers,
  courses: initialCourses,
  recommendations: [],

  setCurrentUser: (user) => {
    set({ currentUser: user });
    // Al entrar hay que recalcular: si el usuario vuelve con interacciones ya
    // guardadas, sus recomendaciones deben estar listas de inmediato.
    get().updateRecommendations();
  },

  addCourse: (course) => set((state) => ({
    courses: [...state.courses, course]
  })),

  addInteraction: (interaction) => set((state) => {
    if (!state.currentUser) return state;

    const updatedUser = {
      ...state.currentUser,
      interactions: [...state.currentUser.interactions, interaction]
    };

    const updatedUsers = state.users.map(user =>
      user.id === updatedUser.id ? updatedUser : user
    );

    setTimeout(() => get().updateRecommendations(), 0);

    return {
      currentUser: updatedUser,
      users: updatedUsers
    };
  }),

  // Inscribirse o darse de baja de un curso.
  //
  // enrolledCourses ya se usaba para filtrar recomendaciones, pero no habia
  // forma de llenarlo: quedaba siempre vacio y ese filtro nunca hacia nada.
  toggleEnrollment: (courseId) => set((state) => {
    if (!state.currentUser) return state;

    const inscrito = state.currentUser.enrolledCourses.includes(courseId);

    const updatedUser: User = {
      ...state.currentUser,
      enrolledCourses: inscrito
        ? state.currentUser.enrolledCourses.filter((id) => id !== courseId)
        : [...state.currentUser.enrolledCourses, courseId],
      interactions: inscrito
        ? state.currentUser.interactions
        : [
            ...state.currentUser.interactions,
            { courseId, timestamp: Date.now(), type: 'enroll' as const }
          ]
    };

    const updatedUsers = state.users.map((user) =>
      user.id === updatedUser.id ? updatedUser : user
    );

    setTimeout(() => get().updateRecommendations(), 0);

    return { currentUser: updatedUser, users: updatedUsers };
  }),

  updateRecommendations: () => {
    const state = get();
    if (!state.currentUser || state.currentUser.interactions.length === 0) {
      set({ recommendations: [] });
      return;
    }

    try {
      const users = state.users;
      const courses = state.courses;
      
      // Simple collaborative filtering approach
      const userInteractions = new Map<string, Set<string>>();
      
      // Build user interaction sets
      users.forEach(user => {
        const interactionSet = new Set<string>();
        user.interactions.forEach(interaction => {
          interactionSet.add(interaction.courseId);
        });
        userInteractions.set(user.id, interactionSet);
      });

      // Calculate similarity scores
      const currentUserInteractions = userInteractions.get(state.currentUser.id) || new Set();
      const similarityScores = new Map<string, number>();

      // Interacciones mas recientes, para recomendar por categoria.
      //
      // Se copia el array antes de ordenar: .sort() ordena en el sitio, y
      // aplicado directamente sobre state.currentUser.interactions mutaba el
      // estado de Zustand fuera de set(), reordenando el historial real del
      // usuario como efecto colateral de calcular recomendaciones.
      const recentInteractions = [...state.currentUser.interactions]
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, 5);
      
      const recentCategories = new Set(
        recentInteractions
          .map(interaction => 
            courses.find(course => course.id === interaction.courseId)?.category
          )
          .filter(Boolean)
      );

      // Etiquetas de los cursos con los que el usuario ya interactuo, para
      // premiar temas afines aunque sean de otra categoria.
      const tagsDeInteres = new Set<string>();
      currentUserInteractions.forEach((id) => {
        courses.find((c) => c.id === id)?.tags.forEach((t) => tagsDeInteres.add(t));
      });

      courses.forEach(course => {
        let score = 0;

        // Antes habia aqui un "+0.5 si el usuario ya interactuo con el curso".
        // Era codigo muerto: esos mismos cursos se descartan mas abajo, asi que
        // ese medio punto no llegaba a influir en ninguna recomendacion.

        // Category preference boost
        if (recentCategories.has(course.category)) {
          score += 0.3;
        }

        // Afinidad por etiquetas compartidas.
        const comunes = course.tags.filter((t) => tagsDeInteres.has(t)).length;
        if (comunes > 0) {
          score += Math.min(comunes * 0.15, 0.45);
        }

        // Score from similar users
        users.forEach(user => {
          if (user.id !== state.currentUser!.id) {
            const userSet = userInteractions.get(user.id) || new Set();
            if (userSet.has(course.id)) {
              // Calculate Jaccard similarity
              const intersection = new Set([...currentUserInteractions].filter(x => userSet.has(x)));
              const union = new Set([...currentUserInteractions, ...userSet]);
              const similarity = intersection.size / union.size;
              score += similarity;
            }
          }
        });

        similarityScores.set(course.id, score);
      });

      // Sort and filter recommendations
      const recommendations = courses
        .filter(course => !state.currentUser!.enrolledCourses.includes(course.id))
        .filter(course => !currentUserInteractions.has(course.id))
        .sort((a, b) => (similarityScores.get(b.id) || 0) - (similarityScores.get(a.id) || 0))
        .slice(0, 3);

      set({ recommendations });
    } catch (error) {
      console.error('Error generating recommendations:', error);
      set({ recommendations: [] });
    }
  }
    }),
    {
      name: 'aula-virtual',
      storage: createJSONStorage(() => localStorage),
      // Solo se guarda lo que genera el usuario. El catalogo de cursos queda
      // fuera a proposito: si se persistiera, cualquier curso nuevo que se
      // agregue al codigo no le llegaria a quien ya tenga datos guardados.
      partialize: (state) => ({
        currentUser: state.currentUser,
        users: state.users
      }),
      // Tras rehidratar desde localStorage hay que recalcular: las
      // recomendaciones no se guardan, se derivan del historial.
      onRehydrateStorage: () => (state) => {
        state?.updateRecommendations();
      }
    }
  )
);

export default useStore;