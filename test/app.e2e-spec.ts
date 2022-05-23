import { INestApplication, ValidationPipe } from "@nestjs/common";
import { Test } from "@nestjs/testing"
import * as pactum from "pactum";
import { PrismaService } from "../src/prisma/prisma.service";
import { AppModule } from "../src/app.module";
import { AuthDto } from "../src/auth/dto";
import { EditUserDto } from "src/user/dto";
import { CreateBookmarkDto } from "src/bookmark/dto";

describe('Test Application e2e', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule]
    }).compile();
    app = moduleRef.createNestApplication()
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }))

    await app.init();
    await app.listen(3333);

    prisma = app.get(PrismaService)

    await prisma.cleanDb();

    pactum.request.setBaseUrl('http://localhost:3333')

  })
  afterAll(() => {
    app.close();
  })

  describe('Auth', () => {
    let dto: AuthDto = {
      email: 'hello@test.com',
      password: '1234'
    };

    describe('Sign Up', () => {
      // Error Handling
      it('should throw exception: No Password', () => {
        return pactum
          .spec()
          .post("/auth/signup")
          .withBody({
            password: dto.password
          })
          .expectStatus(400)
      })
      it('should throw exception: No Email', () => {
        return pactum
          .spec()
          .post("/auth/signup")
          .withBody({
            email: dto.email
          })
          .expectStatus(400)
      })
      it('should throw exception: No Body', () => {
        return pactum
          .spec()
          .post("/auth/signup")
          .expectStatus(400)
      })
      // Successful
      it('should signup successfully.', () => {
        return pactum
          .spec()
          .post("/auth/signup")
          .withBody(dto)
          .expectStatus(201)
      })
    })

    describe('Sign In', () => {
      // Error handling
      it('should throw exception: No Password', () => {
        return pactum
          .spec()
          .post("/auth/signin")
          .withBody({
            password: dto.password
          })
          .expectStatus(400)
      })
      it('should throw exception: No Email', () => {
        return pactum
          .spec()
          .post("/auth/signin")
          .withBody({
            email: dto.email
          })
          .expectStatus(400)
      })
      it('should throw exception: No Body', () => {
        return pactum
          .spec()
          .post("/auth/signin")
          .expectStatus(400)
      })
      it('should throw exception: Bad Password', () => {
        return pactum
          .spec()
          .post("/auth/signin")
          .withBody({
            email: dto.email,
            password: '321'
          })
          .expectStatus(401)
      })
      it('should throw exception: Bad Email', () => {
        return pactum
          .spec()
          .post("/auth/signin")
          .withBody({
            email: "test@test.com",
            password: dto.password
          })
          .expectStatus(400)
      })
      // Successful
      it('should signin successfully.', () => {
        return pactum
          .spec()
          .post("/auth/signin")
          .withBody(dto)
          .expectStatus(200)
          .stores('accessToken', 'access_token')
      })
    })
  })

  describe('Users', () => {
    describe('User Info', () => {
      // Error Handling
      it('should throw exception: No Token', () => {
        return pactum
          .spec()
          .get("/users/me")
          .expectStatus(401)
      })
      // Successful
      it('get user info successfully', () => {
        return pactum
          .spec()
          .get("/users/me")
          .withHeaders({ "Authorization": "Bearer $S{accessToken}" })
          .expectStatus(200)
      })
    })

    describe('Edit User', () => {
      let dto: EditUserDto = {
        email: 'hello@test.com',
        firstName: 'Test',
        lastName: 'User'
      };
      // Error Handling
      it('update user details: No Token', () => {
        return pactum
          .spec()
          .patch("/users/edit")
          .withBody(dto)
          .expectStatus(401)
      })
      // Successful
      it('update user details, optional contents: No Body', () => {
        return pactum
          .spec()
          .patch("/users/edit")
          .withHeaders({ "Authorization": "Bearer $S{accessToken}" })
          .expectStatus(200)
      })
      it('update user details successfully', () => {
        return pactum
          .spec()
          .patch("/users/edit")
          .withBody(dto)
          .withHeaders({ "Authorization": "Bearer $S{accessToken}" })
          .expectStatus(200)
      })
    })
  })

  describe('Bookmarks', () => {
    let createdDto: CreateBookmarkDto = {
      title: "Just a bookmark.",
      link: "https://google.com"
    }
    let editDto: CreateBookmarkDto = {
      title: "Updated this bookmark.",
      link: "https://google.co.uk"
    }
    describe('Get Bookmarks', () => {


      // Successfully
      it("get all users bookmarks successfully. []", () => {
        return pactum
          .spec()
          .get("/bookmarks")
          .withHeaders({ "Authorization": "Bearer $S{accessToken}" })
          .expectStatus(200)
          .expectBody([])
      })
    })

    describe('Create Bookmarks', () => {
      it('shouldnt create a bookmark without body', () => {
        return pactum
          .spec()
          .post("/bookmarks")
          .withHeaders({ "Authorization": "Bearer $S{accessToken}" })
          .withBody({})
          .expectStatus(400)
      })
      // Successfully
      it('should create a bookmark without description', () => {
        return pactum
          .spec()
          .post("/bookmarks")
          .withHeaders({ "Authorization": "Bearer $S{accessToken}" })
          .withBody({ ...createdDto })
          .expectStatus(201)
      })
      it('should create a bookmark with description', () => {
        return pactum
          .spec()
          .post("/bookmarks")
          .withHeaders({ "Authorization": "Bearer $S{accessToken}" })
          .withBody({ ...createdDto, description: "Just another google." })
          .expectStatus(201)
          .stores('bookmarkId', 'id')
      })

      it("get all bookmarks now we have data.", () => {
        return pactum
          .spec()
          .get("/bookmarks")
          .withHeaders({ "Authorization": "Bearer $S{accessToken}" })
          .expectStatus(200)
          .expectJsonLength(2)
      })
    })

    describe('Get Bookmark by ID', () => {
      it("successfully get bookmark by id.", () => {
        return pactum
          .spec()
          .get("/bookmarks/$S{bookmarkId}")
          .withHeaders({ "Authorization": "Bearer $S{accessToken}" })
          .expectStatus(200)
          .inspect()
      })
    })

    describe('Edit Bookmark by ID', () => {
      it('should edit bookmark by id.', () => {
        return pactum
          .spec()
          .patch("/bookmarks/$S{bookmarkId}")
          .withHeaders({ "Authorization": "Bearer $S{accessToken}" })
          .withBody(editDto)
          .expectStatus(200)
      })
    })

    describe('Delete Bookmark by ID', () => {
      it('should delete bookmark.', () => {
        return pactum
          .spec()
          .delete("/bookmarks/$S{bookmarkId}")
          .withHeaders({ "Authorization": "Bearer $S{accessToken}" })
          .withBody(editDto)
          .expectStatus(204)
      })
    })
  })

})