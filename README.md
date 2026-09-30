OFFCORSS | Catálogo de productos
Se crea un aplicación web para una prueba técnica la aplicación permite autenticarse y consultar el catálogo de la tienda virtual OFFCORSS: listado con búsqueda, paginación y exportación a CSV, ficha de producto imprimible y edición del perfil de usuario.

// Como es una preuba el backend está en el plan gratuito de Render.

Se usa un usuario de prueba, con el fin de realizar las pruebas correspondientes
Usuario | Contraseña admin | Admin123*

Funcionalidades
Backend: • Servicio (con Nodejs) para realizar peticiones HTTP. • Consumo de la API de productos de VTEX https://offcorss.myvtex.com/api/catalog_system/pub/products/search/

Database: • MongoDB/MariaDB • Consumo de base de datos usando GRAPHQL

Frontend: • Dashboard con login • Vista de detalle del usuario o Vista de perfil que muestra los datos del usuario loggeado (Username, Create Date, Name, Last Name, Email, User Type) • Los datos del usuario se pueden editar y actualizar en la DB • Vista de listado de registros de productos (Se consume el servicio que consume la api de productos de vtex) • El listado contiene los siguientes campos: Imagen, Id, Producto, Marca, Items y Precio. • Se puede exportar el reporte de los productos • Vista de detalle de la línea del producto con los campos del reporte • Se puede imprimir la vista de detalle • Contiene un logout

Stack
Frontend: React, TypeScript, Vite, Apollo Client, React Router, Tachyons
Backend: Node.js, Express, TypeScript, Apollo Server (GraphQL)
Base de datos: MongoDB Atlas con Mongoose
Deploy: Render (API) y GitHub Pages (frontend)
Estructura
backend/ API Express + GraphQL + proxy a VTEX app/ Aplicación React

Tener en cuenta para correr la aplicación localmente
//BACKEND

cd backend npm install cp .env.example .env # Se deben completar la información correspondiente npm run seed # crea el usuario admin npm run dev # http://localhost:3000

//FROTEND

cd app npm install npm run dev # http://localhost:5173

Variables de entorno (backend/.env):

| Variable | Descripción |

MONGO_URI= conexión con MongoDB Atlas  JWT_SECRET= Texto largo y aleatorio PORT= Puerto del servidor (por defecto 3000) | CORS_ORIGIN= Origen permitido del frontend, ej.http://localhost:5173`

//API's

POST /graphql: login, me y updateUser. GET /api/products?page=1&pageSize=12&q=texto: listado paginado con búsqueda. GET /api/products/:id: detalle de un producto.

Los endpoints de productos y las consultas en GRAPHQL requieren el header Authorization: Bearer .

Notas extra
Se tuvo en cuenta la versión movil

Autora
[Haisiuleth] · [haisiuleth@gmail.com]
