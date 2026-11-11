import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FoundItems } from './found-items';

describe('FoundItems', () => {
  let component: FoundItems;
  let fixture: ComponentFixture<FoundItems>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FoundItems],
    }).compileComponents();

    fixture = TestBed.createComponent(FoundItems);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
