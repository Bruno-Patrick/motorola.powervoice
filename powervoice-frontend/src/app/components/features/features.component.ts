import { DOCUMENT } from '@angular/common';
import { Component, EventEmitter, HostListener, Inject, OnInit, Output } from '@angular/core';
import { NgForm } from '@angular/forms';
import { NgbModal, NgbModalConfig } from '@ng-bootstrap/ng-bootstrap';
import { Category } from 'src/app/models/categorys/category';
import { Feature } from 'src/app/models/features/feature.model';
import { Product } from 'src/app/models/products/product';
import { Reaction } from 'src/app/models/reactions/reaction';
import { ReportCategory } from 'src/app/models/report-category/report-category';
import { User } from 'src/app/models/users/user';
import { AlertaService } from 'src/app/services/alertas/alerta.service';
import { CategoryService } from 'src/app/services/category/category.service';
import { FeatureService } from 'src/app/services/features/feature.service';
import { LoginService } from 'src/app/services/logins/login.service';
import { ProductService } from 'src/app/services/products/product.service';
import { ReactionService } from 'src/app/services/reactions/reaction.service';
import { ReportCategoryService } from 'src/app/services/reportCategory/report-category.service';
import { WINDOW } from 'src/app/services/window/window.service';
import { Utils } from 'src/app/utils/utils';

@Component({
  selector: 'app-features',
  templateUrl: './features.component.html',
  styleUrls: ['./features.component.scss'],
})

export class FeaturesComponent implements OnInit {

  public asideIsFixed: boolean = false;

  constructor(
    // Injeta token para obter o valor do objeto
    @Inject(DOCUMENT) private document: Document,
    @Inject(WINDOW) private window: Window,


    private servico: FeatureService,
    private servicoReportCategory: ReportCategoryService,
    private servicoProduct: ProductService,
    private servicoLogin: LoginService,
    private servicoAlerta: AlertaService,
    private modalService: NgbModal,
    private servicoReaction: ReactionService,
    config: NgbModalConfig,
  ) { }

  // @Output() atualizaLiked = new EventEmitter<any>();

  registros: Feature[] = Array<Feature>();
  registroBusca: Feature[] = Array<Feature>();
  registro: Feature = <Feature>{};
  categoryId: Category[] = Array<Category>();
  productId: Product[] = Array<Product>();
  category: Category = <Category>{};
  product: Product = <Product>{};
  reportCategorys: ReportCategory[] = Array<ReportCategory>();
  termoBusca: string = "";
  recuperaLikes: Feature[] = Array<Feature>();
  novoLiked: Feature[] = Array<Feature>();
  compareById = Utils.compareById;
  page: number = 1;
  registroPage: number = 1;

  form = {
    product: '',
    category: '',
  };

  // fun????o da bilbioteca ngx scroll infitiry
  onScrollDown(): void {


        // Se estiver fazendo uma busca, chama a fun????o de busca e reseta o ??ndice do scroll;
    if (this.product.id || this.category.id) {
      this.filter();
      this.page = 1;
    }
    else {
    // Se estiver fazendo uma busca, chama a fun????o de busca e reseta o ??ndice do scroll;
    if (this.termoBusca) {
      this.buscaRegistros(this.termoBusca, this.page++)
    }
    else
    // Caso n??o atenda alguma das condi????es anteriores, chama o m??todo get incrementando o ??ndice scroll;
    this.get(this.page++);
    }
  }
  resetaRegistroBusca()
  {
    this.registroBusca = [];
  }

  // Recupera registros paginados;
  get(page?: number): void {
    this.servico.get(page).subscribe((data) => {
    this.registros = this.registros.concat(data.content);
    });
  }
  
  // Submit do formul??rio de cadastro de features
  submit(form: NgForm): void {
    // Se o formul??rio for inv??lido, n??o faz o submit
    if (form.invalid) {
      return;
    } 
    // Caso o formul??rio seja v??lido, recupera o id do usu??rio logado e submete o registro
    // para o servidor.
    else {
      this.registro.userId = this.getUsuarioAutenticado().id;
      this.servico.insert(this.registro).subscribe({
        complete: () => {
          // Se a a????o for completada, reseta o formul??rio, atualiza os registros e emite
          // um alerta de sucesso;
          form.resetForm();
          this.registros = [];
          this.get();
          this.servicoAlerta.enviarAlertaSucesso('Feature Cadastrada')
        },
        error: err => err.status === 400 ? this.servicoAlerta.enviarAlertaAviso('Voc?? adicionou uma publica????o agora h?? pouco. Aguarde alguns instantes para publicar novamente!') : null

      })
    }
  }
  
  // Recupera a lista de produtos do endpoint;
  getProduct() {
    this.servicoProduct.get().subscribe({
      next: (resposta: Product[]) => {
        this.productId = resposta.sort((a, b) => a.name.localeCompare(b.name));
      }
    });
  }

  // Recupera a lista de categorias de reports do endpoint
  getReportCategory():void{
    if (this.isAutenticado())
    this.servicoReportCategory.get().subscribe({
      next: (resposta : ReportCategory[]) => {
        this.reportCategorys = resposta
      }
    })
  }

  // Condiciona passar o id do produto. Ap??s disparar o evento no form (selecionar o produto), ele recupera
  // do endpoint todas as categorias vinculadas ??quele id.
  setCategory(): void {
    let id = this.registro.productId;
    if (id) {
      this.servicoProduct.categoryByProduct(id).subscribe({
        next: (resposta: any) => {
          this.categoryId = resposta.productCategory;
        }
      })
    }
  }

  // Verifica autentica????o
  isAutenticado(): boolean {
    return this.servicoLogin.isAutenticado();
  }
  // Recupera o usu??rio autenticado
  getUsuarioAutenticado(): User {
    return this.servicoLogin.getUsuario();
  }



  // Filtro de pesquisa
  @Output() eventoBusca = new EventEmitter();

  // Filtro de busca gen??rica
  buscaRegistros(termoBusca?: string, page?:number) {
    if (termoBusca) {
      this.servico.busca(termoBusca, page).subscribe((data) => {
        this.registroBusca = this.registroBusca.concat(data.content);
        this.registros = this.registroBusca;
      }) 
    }
    else {
      this.registros = [];
      this.get();
    }
  }

  // Filtro para pesquisa de features por produto/categoria.
  filter() {
    if (this.category || this.product) {
      this.servico.filterProductAndCategory(this.category, this.product).subscribe({
        next: (resposta: Feature[]) => {
          this.registros = resposta;
        },
        error: err => err.status === 401 ? this.servicoAlerta.enviarAlertaErro('N??o autorizado!') : null
      });
    }
    else {
      if (this.category)
      this.get();
    }
    // this.get();
  }

  // Recupera as categorias dependentes dos produtos (se????o de filtros)
  filterCategoryByProduct(): void {
    let id = this.product.id
    if (id) {
      this.servicoProduct.categoryByProduct(id).subscribe({
        next: (resposta: any) => {
          this.categoryId = resposta.productCategory;
        },
        error: err => err.status === 401 ? this.servicoAlerta.enviarAlertaErro('N??o autorizado!') : null
      }
      )
    }
    else {
      this.get();
    }
  }

  // Ativado com o output/eventEmitter de featureCards.
  getLikesUsuario(): void {
    // verifica se o usu??rio est?? logado para prosseguir com a fun????o.
    if (this.isAutenticado()) {
      // Passa o id do usu??rio logado para o endpoint;
      this.servicoReaction.getListUserLikes(this.getUsuarioAutenticado().id).subscribe({
        next: (resposta: Reaction[]) => {
          // Recupera a lista de features que esse usu??rio deu like;
          this.recuperaLikes = resposta.map((resposta: Reaction) => resposta.feature)
        },
        complete: () => {
          // Ap??s completar a a????o, salva a lista de features no sessionStorage e possibilita
          // ao componente features-cards, recuperar a lista de features com likes atualizada;
          sessionStorage.setItem('registroLikes', JSON.stringify(this.recuperaLikes));
        },
      });
    }
  }

  // Se????o dos modais
  open(content: any) {
    this.modalService.open(content, { size: 'lg', keyboard: false, backdrop: 'static' });
  }

  openAvisoLogin(content: any) {
    this.modalService.open(content, { size: 'lg', keyboard: true, backdrop: true });
  }
  


  // Scroll
  @HostListener("window:scroll", [])
  onWindowScroll() {
    let number = this.window.pageYOffset || this.document.documentElement.scrollTop || this.document.body.scrollTop || 0;
    if (number > 300) {
      this.asideIsFixed = true;
    } else if (this.asideIsFixed && number < 200) {
      this.asideIsFixed = false;
    }
  }

  ngOnInit(): void {
    this.get();
    this.getProduct();
    this.getLikesUsuario();
    this.getReportCategory();
  }
}